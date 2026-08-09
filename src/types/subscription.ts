export type SubscriptionRole = 'athlete' | 'coach';
export type SubscriptionTier = 'free' | 'pro' | 'basic' | 'plus';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface SubscriptionDetails {
  tier: SubscriptionTier;
  role: SubscriptionRole;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  maxAthletes: number; // 0 for athlete, 5 for coach basic, 15 for coach plus
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
export const COACH_BASIC_ATHLETE_LIMIT = 5;
export const COACH_PLUS_ATHLETE_LIMIT = 15;

// Environment Price ID getters with fallback strings for test mode
export const STRIPE_PRICE_ATHLETE_PRO = import.meta.env.VITE_STRIPE_PRICE_ATHLETE_PRO || 'price_athlete_pro_test';
export const STRIPE_PRICE_COACH_BASIC = import.meta.env.VITE_STRIPE_PRICE_COACH_BASIC || 'price_coach_basic_test';
export const STRIPE_PRICE_COACH_PLUS = import.meta.env.VITE_STRIPE_PRICE_COACH_PLUS || 'price_coach_plus_test';
