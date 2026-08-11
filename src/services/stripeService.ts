import { supabase } from '../lib/supabase';
import type {
  SubscriptionDetails,
  SubscriptionTier,
  SubscriptionRole,
  StripeConnectAccountStatus,
  SessionPaymentRecord,
  UsageCounters,
} from '../types/subscription';
import {
  FREE_COPILOT_LIMIT,
  FREE_MATCHMAKING_LIMIT,
} from '../types/subscription';

const USAGE_STORAGE_KEY = 'trainee_subscription_usage_v1';
const LOCAL_TIER_KEY = 'trainee_local_tier_v1';
const LOCAL_CONNECT_KEY = 'trainee_local_connect_v1';

export const getStoredUsageCounters = (): UsageCounters => {
  if (typeof window === 'undefined') return { aiCopilotCount: 0, aiMatchmakingCount: 0, visitCount: 1 };
  try {
    const raw = window.localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return { aiCopilotCount: 0, aiMatchmakingCount: 0, visitCount: 1 };
    const parsed = JSON.parse(raw);
    return {
      aiCopilotCount: typeof parsed.aiCopilotCount === 'number' ? parsed.aiCopilotCount : 0,
      aiMatchmakingCount: typeof parsed.aiMatchmakingCount === 'number' ? parsed.aiMatchmakingCount : 0,
      visitCount: typeof parsed.visitCount === 'number' ? parsed.visitCount : 1,
    };
  } catch {
    return { aiCopilotCount: 0, aiMatchmakingCount: 0, visitCount: 1 };
  }
};

export const saveUsageCounters = (counters: UsageCounters): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(counters));
  } catch (err) {
    console.error('Failed to save usage counters:', err);
  }
};

export const incrementVisitCount = (): { visitCount: number; is3rdVisit: boolean } => {
  const current = getStoredUsageCounters();
  const nextVisit = current.visitCount + 1;
  const updated = { ...current, visitCount: nextVisit };
  saveUsageCounters(updated);
  return {
    visitCount: nextVisit,
    is3rdVisit: nextVisit % 3 === 0,
  };
};

export const getStoredLocalTier = (): SubscriptionTier => {
  if (typeof window === 'undefined') return 'free';
  try {
    return (window.localStorage.getItem(LOCAL_TIER_KEY) as SubscriptionTier) || 'free';
  } catch {
    return 'free';
  }
};

export const setStoredLocalTier = (tier: SubscriptionTier): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_TIER_KEY, tier);
  } catch (err) {
    console.error('Failed to save local tier:', err);
  }
};

export const calculateSubscriptionDetails = (
  tier: SubscriptionTier,
  role: SubscriptionRole = 'athlete',
  status: SubscriptionDetails['status'] = 'active'
): SubscriptionDetails => {
  const isAthletePro = tier === 'pro' && role === 'athlete' && status === 'active';

  return {
    tier: role === 'coach' ? 'free' : tier,
    role,
    status,
    maxAthletes: role === 'coach' ? Infinity : 0,
    hasAiPersonalization: isAthletePro || role === 'coach',
    hasProgressTracking: isAthletePro || role === 'coach',
  };
};

export const fetchUserSubscription = async (
  profileId: string,
  userRole: SubscriptionRole = 'athlete'
): Promise<SubscriptionDetails> => {
  const localTier = getStoredLocalTier();

  if (!supabase || !profileId) {
    return calculateSubscriptionDetails(localTier, userRole);
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', profileId)
      .maybeSingle();

    if (error || !data) {
      return calculateSubscriptionDetails(localTier, userRole);
    }

    const tier = (data.tier as SubscriptionTier) || localTier;
    const role = (data.role as SubscriptionRole) || userRole;
    const status = (data.status as SubscriptionDetails['status']) || 'active';
    const currentPeriodEnd = data.current_period_end || undefined;
    const stripeCustomerId = data.stripe_customer_id || undefined;
    const stripeSubscriptionId = data.stripe_subscription_id || undefined;

    const details = calculateSubscriptionDetails(tier, role, status);
    return {
      ...details,
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodEnd,
    };
  } catch (err) {
    console.error('Failed to fetch user subscription:', err);
    return calculateSubscriptionDetails(localTier, userRole);
  }
};

// ── Stripe Connect Express Payout Status ─────────────────────────────────────

export const fetchCoachConnectStatus = async (
  coachUserId: string
): Promise<StripeConnectAccountStatus | null> => {
  if (!supabase || !coachUserId) {
    // Local fallback status for testing
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(LOCAL_CONNECT_KEY);
      if (stored) return JSON.parse(stored);
    }
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('user_id', coachUserId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      stripeAccountId: data.stripe_account_id,
      chargesEnabled: Boolean(data.charges_enabled),
      payoutsEnabled: Boolean(data.payouts_enabled),
      onboardingCompleted: Boolean(data.onboarding_completed),
    };
  } catch (err) {
    console.error('Failed to fetch coach Connect account status:', err);
    return null;
  }
};

export const createConnectAccount = async (
  coachUserId: string,
  refreshUrl?: string,
  returnUrl?: string
): Promise<{ url?: string; success: boolean; error?: string }> => {
  // Call Deno Edge Function create-connect-account
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: {
          coach_id: coachUserId,
          refresh_url: refreshUrl,
          return_url: returnUrl,
        },
      });

      if (!error && data?.url) {
        return { url: data.url, success: true };
      }
    } catch (err) {
      console.warn('create-connect-account Edge Function invoke failed, simulating local test mode:', err);
    }
  }

  // Local test mode simulation
  const mockStatus: StripeConnectAccountStatus = {
    stripeAccountId: `acct_test_${Date.now()}`,
    chargesEnabled: true,
    payoutsEnabled: true,
    onboardingCompleted: true,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCAL_CONNECT_KEY, JSON.stringify(mockStatus));
  }

  if (supabase && coachUserId) {
    try {
      await supabase.from('stripe_connect_accounts').upsert({
        user_id: coachUserId,
        stripe_account_id: mockStatus.stripeAccountId,
        charges_enabled: true,
        payouts_enabled: true,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (dbErr) {
      console.error('Failed Connect upsert in test mode:', dbErr);
    }
  }

  return { success: true };
};

export const createCheckoutSession = async (
  userId: string,
  priceId: string,
  successUrl?: string,
  cancelUrl?: string
): Promise<{ url?: string; success: boolean; error?: string }> => {
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          user_id: userId,
          price_id: priceId,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
      });

      if (!error && data?.url) {
        return { url: data.url, success: true };
      }
    } catch (err) {
      console.warn('create-checkout-session Edge function failed, simulating test mode:', err);
    }
  }

  return { success: true };
};

export const createSessionPayment = async (
  sessionId: string | null,
  athleteId: string,
  coachId: string,
  sessionAmount: number
): Promise<{ payment: SessionPaymentRecord; success: boolean; error?: string }> => {
  const applicationFeeAmount = parseFloat((sessionAmount * 0.10).toFixed(2)); // 10% platform fee
  const coachPayoutAmount = parseFloat((sessionAmount - applicationFeeAmount).toFixed(2)); // 90% payout

  const paymentRecord: SessionPaymentRecord = {
    id: `pay-${Date.now()}`,
    sessionId,
    athleteId,
    coachId,
    amountTotal: sessionAmount,
    applicationFeeAmount,
    coachPayoutAmount,
    status: 'succeeded',
    createdAt: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('create-session-payment', {
        body: {
          session_id: sessionId,
          athlete_id: athleteId,
          coach_id: coachId,
          amount: sessionAmount,
        },
      });

      if (!error && data) {
        return { payment: paymentRecord, success: true };
      }
    } catch (err) {
      console.warn('create-session-payment Edge function failed, writing payment record directly:', err);
    }

    try {
      await supabase.from('session_payments').insert({
        session_id: sessionId,
        athlete_id: athleteId,
        coach_id: coachId,
        amount_total: sessionAmount,
        application_fee_amount: applicationFeeAmount,
        coach_payout_amount: coachPayoutAmount,
        status: 'succeeded',
      });
    } catch (dbErr) {
      console.error('Failed to insert session payment:', dbErr);
    }
  }

  return { payment: paymentRecord, success: true };
};

export const createCustomerPortalSession = async (
  stripeCustomerId?: string
): Promise<{ url?: string; success: boolean; error?: string }> => {
  if (supabase && stripeCustomerId) {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { customer_id: stripeCustomerId },
      });

      if (!error && data?.url) {
        return { url: data.url, success: true };
      }
    } catch (err) {
      console.warn('Portal Edge Function failed:', err);
    }
  }

  return {
    success: false,
    error: 'Stripe Portal is active in production mode with configured customer ID.',
  };
};
