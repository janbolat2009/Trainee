import React from 'react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface ProGateBannerProps {
  title?: string;
  description?: string;
  requiredTier?: string;
  reason?: 'copilot_limit' | 'matchmaking_limit' | 'general';
}

export const ProGateBanner: React.FC<ProGateBannerProps> = ({
  title = 'Pro Feature Locked',
  description = 'Upgrade to Athlete Pro to unlock full access to this feature.',
  requiredTier = 'Athlete Pro ($7.99/mo)',
  reason = 'general',
}) => {
  const { openPricingModal } = useApp();

  return (
    <div className="rounded-3xl border border-brand-accent/30 bg-gradient-to-r from-brand-accent/10 via-brand-dark/90 to-brand-dark p-6 sm:p-8 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
      <div className="flex items-start space-x-4">
        <div className="p-3 rounded-2xl bg-brand-accent/20 border border-brand-accent/40 text-brand-accent shrink-0">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-accent/20 text-brand-accent border border-brand-accent/40 uppercase tracking-wider">
              {requiredTier}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={() => openPricingModal(reason)}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-accent text-black text-xs font-extrabold hover:bg-zinc-200 transition shadow-glow-accent flex items-center justify-center space-x-2 shrink-0"
      >
        <Sparkles className="w-4 h-4 fill-black" />
        <span>Upgrade Now</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
