export type SubscriptionRole = 'athlete' | 'coach';
export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface SubscriptionDetails {
  tier: SubscriptionTier;
  role: SubscriptionRole;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  maxAthletes: number; // Infinity for coaches (unlimited), 0 for athletes
  hasAiPersonalization: boolean;
  hasProgressTracking: boolean;
}

export interface StripeConnectAccountStatus {
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingCompleted: boolean;
}

export interface SessionPaymentRecord {
  id: string;
  sessionId: string | null;
  athleteId: string;
  coachId: string | null;
  amountTotal: number;
  applicationFeeAmount: number; // 10% platform fee
  coachPayoutAmount: number; // 90% coach payout
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
}

export interface UsageCounters {
  aiCopilotCount: number;
  aiMatchmakingCount: number;
  visitCount: number;
}

export const FREE_COPILOT_LIMIT = 6;
export const FREE_MATCHMAKING_LIMIT = 5;

// Environment Price ID getters for Athlete Pro
export const STRIPE_PRICE_ATHLETE_PRO = import.meta.env.VITE_STRIPE_PRICE_ATHLETE_PRO || 'price_athlete_pro_test';
