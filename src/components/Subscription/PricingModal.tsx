import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Shield, Lock, CreditCard, ArrowRight, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { SubscriptionTier } from '../../types/subscription';
import { createCheckoutSession, createCustomerPortalSession } from '../../services/stripeService';

export interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerReason?: 'copilot_limit' | 'matchmaking_limit' | 'student_limit' | 'visit_trigger' | 'general';
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  triggerReason = 'general',
}) => {
  const { currentProfile, subscription, refreshSubscription, addNotification } = useApp();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTier = subscription.tier;

  const handleSelectTier = async (tier: SubscriptionTier) => {
    if (tier === currentTier) return;
    setIsProcessing(tier);

    try {
      const profileId = currentProfile?.profile.id || 'guest-user';
      const priceId = import.meta.env.VITE_STRIPE_PRICE_ATHLETE_PRO || 'price_athlete_pro_test';

      const result = await createCheckoutSession(profileId, priceId);

      if (result.url) {
        window.location.href = result.url;
        return;
      }

      if (result.success) {
        await refreshSubscription();
        addNotification({
          type: 'success',
          title: 'Subscription Updated!',
          message: `You are now subscribed to the ${tier.toUpperCase()} plan.`,
        });
        onClose();
      }
    } catch (err: any) {
      addNotification({
        type: 'risk',
        title: 'Subscription Error',
        message: err?.message || 'Could not process subscription checkout.',
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleOpenPortal = async () => {
    if (!subscription.stripeCustomerId) {
      addNotification({
        type: 'info',
        title: 'Test Mode Subscription',
        message: 'You are currently on local test mode. You can select another plan directly.',
      });
      return;
    }

    setIsProcessing('portal');
    try {
      const result = await createCustomerPortalSession(subscription.stripeCustomerId);
      if (result.url) {
        window.location.href = result.url;
      } else {
        addNotification({
          type: 'info',
          title: 'Manage Subscription',
          message: result.error || 'Opening customer billing portal...',
        });
      }
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-4xl rounded-3xl border border-brand-border bg-brand-dark/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 max-h-[90vh] overflow-y-auto z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Banner */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-brand-accent/30 bg-brand-accent/10 text-xs font-semibold text-brand-accent">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TRAINEE ATHLETE PRO</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Unlock Peak Athletic Performance
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
              Upgrade to Athlete Pro for unlimited AI-powered coaching guidance, matchmaking, and biomechanical analytics.
            </p>
          </div>

          {/* Reason Alert Banner if triggered by limits */}
          {triggerReason === 'copilot_limit' && (
            <div className="p-4 rounded-2xl bg-brand-accent/15 border border-brand-accent/40 text-xs text-brand-accent flex items-center space-x-3">
              <Lock className="w-5 h-5 shrink-0" />
              <span>
                <strong>Free AI Copilot Limit Reached (6 Queries):</strong> Upgrade to <strong>Athlete Pro</strong> ($7.99/mo) for unlimited AI guidance and instant biomechanical insights!
              </span>
            </div>
          )}

          {triggerReason === 'matchmaking_limit' && (
            <div className="p-4 rounded-2xl bg-brand-accent/15 border border-brand-accent/40 text-xs text-brand-accent flex items-center space-x-3">
              <Lock className="w-5 h-5 shrink-0" />
              <span>
                <strong>Free AI Matchmaking Limit Reached (5 Runs):</strong> Upgrade to <strong>Athlete Pro</strong> ($7.99/mo) to unlock unlimited AI matching with elite coaches!
              </span>
            </div>
          )}

          {/* Pricing Grid (Side by side Freemium vs Pro) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Free Athlete Tier */}
            <div className={`rounded-3xl border p-6 space-y-5 flex flex-col justify-between transition ${
              currentTier === 'free' ? 'border-zinc-500 bg-white/[0.02]' : 'border-brand-border bg-brand-dark/50'
            }`}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">Freemium</h3>
                    <p className="text-xs text-zinc-400">Essential Athlete Access</p>
                  </div>
                  {currentTier === 'free' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Current Plan
                    </span>
                  )}
                </div>

                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-white">$0</span>
                  <span className="text-xs text-zinc-400">/ forever</span>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-300 pt-2">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Basic coach search & profile browsing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>6 Free AI Copilot queries</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>5 Free AI Matchmaking runs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1-on-1 session bookings</span>
                  </li>
                </ul>
              </div>

              <button
                disabled={currentTier === 'free'}
                onClick={() => handleSelectTier('free')}
                className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-zinc-400 hover:text-white disabled:opacity-50 transition"
              >
                {currentTier === 'free' ? 'Your Current Plan' : 'Downgrade to Free'}
              </button>
            </div>

            {/* Pro Athlete Tier */}
            <div className={`rounded-3xl border p-6 space-y-5 flex flex-col justify-between relative overflow-hidden transition ${
              currentTier === 'pro'
                ? 'border-brand-accent bg-brand-accent/10 shadow-glow-accent'
                : 'border-brand-accent/40 bg-gradient-to-b from-brand-accent/10 via-brand-dark to-brand-dark'
            }`}>
              <div className="absolute top-0 right-0 bg-brand-accent text-black text-[9px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                RECOMMENDED
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center space-x-1.5">
                      <span>Trainee Athlete Pro</span>
                      <Sparkles className="w-4 h-4 text-brand-accent" />
                    </h3>
                    <p className="text-xs text-brand-muted">Personalization & Progress Tracking</p>
                  </div>
                  {currentTier === 'pro' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-accent/20 text-brand-accent border border-brand-accent/40">
                      Active Pro
                    </span>
                  )}
                </div>

                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-white">$7.99</span>
                  <span className="text-xs text-zinc-400">/ month</span>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-200 pt-2">
                  <li className="flex items-center space-x-2 font-medium">
                    <Check className="w-4 h-4 text-brand-accent shrink-0" />
                    <span><strong>Unlimited AI Copilot</strong> assistance</span>
                  </li>
                  <li className="flex items-center space-x-2 font-medium">
                    <Check className="w-4 h-4 text-brand-accent shrink-0" />
                    <span><strong>Unlimited AI Matchmaking</strong> runs</span>
                  </li>
                  <li className="flex items-center space-x-2 font-medium">
                    <Check className="w-4 h-4 text-brand-accent shrink-0" />
                    <span><strong>Performance Vector Audit</strong> & analytics</span>
                  </li>
                  <li className="flex items-center space-x-2 font-medium">
                    <Check className="w-4 h-4 text-brand-accent shrink-0" />
                    <span>Priority coach booking & direct chat</span>
                  </li>
                </ul>
              </div>

              <button
                disabled={isProcessing !== null || currentTier === 'pro'}
                onClick={() => handleSelectTier('pro')}
                className="w-full py-3 rounded-xl bg-brand-accent text-black text-xs font-bold hover:bg-zinc-200 transition shadow-glow-accent flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isProcessing === 'pro' ? (
                  <span>Redirecting to Stripe...</span>
                ) : currentTier === 'pro' ? (
                  <span>Active Plan</span>
                ) : (
                  <>
                    <span>Upgrade for $7.99/mo</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stripe Billing Portal Button for existing subscribers */}
          <div className="pt-4 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-brand-accent" />
              <span>Encrypted Stripe Checkout • Cancel anytime</span>
            </div>

            <button
              onClick={handleOpenPortal}
              className="flex items-center space-x-1.5 text-xs text-brand-accent hover:underline font-semibold"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Manage Billing via Stripe Portal</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
