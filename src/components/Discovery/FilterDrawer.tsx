import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ isOpen, onClose }) => {
  const { filters, setFilters, resetFilters } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="w-full sm:max-w-lg bg-brand-card border-t sm:border border-brand-border rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-border/60">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-brand-accent" />
            <h2 className="text-xl font-extrabold text-white uppercase tracking-tight">
              Filter Coaches
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={resetFilters}
              className="p-2 text-xs text-brand-muted hover:text-white flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="py-6 space-y-6">
          
          {/* Max Hourly Rate Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-brand-muted">MAX HOURLY RATE</span>
              <span className="text-brand-accent font-bold">${filters.maxPrice} / hr</span>
            </div>
            <input
              type="range"
              min="50"
              max="250"
              step="5"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
              className="w-full accent-brand-accent bg-brand-border h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>$50</span>
              <span>$150</span>
              <span>$250+</span>
            </div>
          </div>

          {/* Coaching Philosophy Style */}
          <div>
            <label className="text-xs font-mono uppercase text-brand-muted mb-2 block">
              Coaching Methodology
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['All', 'Data-Driven', 'Mindset & Elite Performance', 'High Intensity', 'Holistic & Tactical', 'Technical Precision'].map((style) => (
                <button
                  key={style}
                  onClick={() => setFilters({ ...filters, coachingStyle: style })}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition ${
                    filters.coachingStyle === style
                      ? 'bg-brand-elevated border border-brand-accent text-white'
                      : 'bg-brand-dark border border-brand-border text-brand-muted hover:text-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Only Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-dark border border-brand-border">
            <div>
              <div className="font-bold text-white text-xs">Verified Coaches Only</div>
              <div className="text-[11px] text-brand-muted">Filter for IAAF, UEFA, or ITF credentialed coaches.</div>
            </div>
            <button
              onClick={() => setFilters({ ...filters, verifiedOnly: !filters.verifiedOnly })}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                filters.verifiedOnly ? 'bg-brand-accent' : 'bg-brand-border'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black transition-transform ${
                  filters.verifiedOnly ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Availability */}
          <div>
            <label className="text-xs font-mono uppercase text-brand-muted mb-2 block">
              Spot Availability
            </label>
            <div className="flex gap-2">
              {['All', 'Immediate', 'Limited Spots'].map((avail) => (
                <button
                  key={avail}
                  onClick={() => setFilters({ ...filters, availability: avail })}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    filters.availability === avail
                      ? 'bg-white text-black font-bold'
                      : 'bg-brand-dark border border-brand-border text-brand-muted hover:text-white'
                  }`}
                >
                  {avail}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Apply CTA */}
        <div className="pt-4 border-t border-brand-border/60">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-glow-white"
          >
            Apply Filters
          </button>
        </div>

      </motion.div>
    </div>
  );
};
