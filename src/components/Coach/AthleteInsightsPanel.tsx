import React from 'react';
import { Activity, HeartPulse, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export const AthleteInsightsPanel: React.FC = () => {
  const { athleteInsights } = useApp();

  const insights = athleteInsights.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel rounded-3xl border border-brand-border p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-eyebrow mb-1">Athlete insight hub</p>
          <h2 className="text-base font-semibold text-white">Live wellness and progress signals</h2>
        </div>
        <div className="rounded-2xl border border-brand-accent/25 bg-brand-accent/10 p-2 text-brand-accent">
          <TrendingUp className="h-4 w-4" />
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-brand-border p-5 text-sm text-brand-muted">
          Athlete updates will appear here as soon as they submit wellbeing notes, recovery data, or progress check-ins.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {insights.map((insight) => (
            <div key={insight.id} className="rounded-2xl border border-brand-border bg-brand-dark/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{insight.athleteName}</p>
                  <p className="mt-1 text-xs text-brand-muted">{insight.summary}</p>
                </div>
                <div className="rounded-full border border-brand-accent/20 bg-brand-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-brand-accent">
                  {insight.source}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                  <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
                  {insight.mood}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                  <Activity className="h-3.5 w-3.5 text-brand-accent" />
                  {new Date(insight.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {insight.note && <p className="mt-3 text-xs leading-relaxed text-zinc-300">{insight.note}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-brand-border bg-white/5 p-3 text-[11px] text-brand-muted">
        <Sparkles className="h-3.5 w-3.5 text-brand-accent" />
        <span>This panel is ready for future metrics like sleep, recovery, and training load.</span>
      </div>
    </motion.div>
  );
};
