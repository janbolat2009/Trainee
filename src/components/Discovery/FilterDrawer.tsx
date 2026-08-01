import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, SlidersHorizontal, RotateCcw, Check, Sparkles, Languages, CalendarDays, MonitorPlay, BriefcaseBusiness } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const pillClass = (active: boolean) => active
  ? 'bg-brand-accent text-black border-brand-accent'
  : 'bg-brand-dark border-brand-border text-brand-muted hover:text-white';

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ isOpen, onClose }) => {
  const { filters, setFilters, resetFilters } = useApp();

  if (!isOpen) return null;

  const updateFilter = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const toggleLanguage = (language: string) => {
    const present = filters.languages.includes(language);
    const next = present ? filters.languages.filter((entry) => entry !== language) : [...filters.languages, language];
    updateFilter('languages', next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="w-full max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-brand-border bg-brand-card p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:border"
      >
        <div className="flex items-center justify-between border-b border-brand-border/60 pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-brand-accent/30 bg-brand-accent/10 p-2 text-brand-accent">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-white">Advanced Filters</h2>
              <p className="text-[11px] text-brand-muted">Refine by sport, experience, budget, and more.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={resetFilters} className="flex items-center gap-1 rounded-xl border border-brand-border bg-brand-dark px-2.5 py-2 text-[11px] text-brand-muted transition hover:text-white">
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
            <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-brand-muted transition hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 py-5">
          <div className="rounded-2xl border border-brand-border bg-brand-dark/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-brand-muted">Price range</p>
                <p className="text-sm font-semibold text-white">${filters.priceRange.min} - ${filters.priceRange.max}/hr</p>
              </div>
              <span className="rounded-full border border-brand-accent/20 bg-brand-accent/10 px-2.5 py-1 text-[10px] font-semibold text-brand-accent">Interactive</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-[11px] text-brand-muted">
                <span className="mb-1 block">Minimum</span>
                <input type="range" min="50" max="250" step="5" value={filters.priceRange.min} onChange={(event) => updateFilter('priceRange', { ...filters.priceRange, min: Number(event.target.value) })} className="w-full accent-brand-accent" />
              </label>
              <label className="text-[11px] text-brand-muted">
                <span className="mb-1 block">Maximum</span>
                <input type="range" min="50" max="250" step="5" value={filters.priceRange.max} onChange={(event) => updateFilter('priceRange', { ...filters.priceRange, max: Number(event.target.value) })} className="w-full accent-brand-accent" />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-dark/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-brand-accent" />
              <span>Minimum rating</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[0, 4, 4.5, 5].map((value) => (
                <button key={value} onClick={() => updateFilter('minRating', value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${pillClass(filters.minRating === value)}`}>
                  {value === 0 ? 'Any' : `⭐ ${value}+`}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-dark/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <BriefcaseBusiness className="h-4 w-4 text-brand-accent" />
              <span>Experience</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Any', '1-3', '3-5', '5-10', '10+'].map((value) => (
                <button key={value} onClick={() => updateFilter('experience', value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${pillClass(filters.experience === value)}`}>{value}</button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-dark/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Languages className="h-4 w-4 text-brand-accent" />
              <span>Languages</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['English', 'Spanish', 'French', 'Arabic', 'Portuguese', 'German'].map((language) => (
                <button key={language} onClick={() => toggleLanguage(language)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${pillClass(filters.languages.includes(language))}`}>{language}</button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-dark/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <CalendarDays className="h-4 w-4 text-brand-accent" />
              <span>Availability</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Any', 'Today', 'This Week', 'Weekends', 'Evenings'].map((value) => (
                <button key={value} onClick={() => updateFilter('availabilityWindow', value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${pillClass(filters.availabilityWindow === value)}`}>{value}</button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-dark/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <MonitorPlay className="h-4 w-4 text-brand-accent" />
              <span>Training format</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Any', 'Online', 'Offline', 'Hybrid'].map((value) => (
                <button key={value} onClick={() => updateFilter('trainingFormat', value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${pillClass(filters.trainingFormat === value)}`}>{value}</button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-dark/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Check className="h-4 w-4 text-brand-accent" />
              <span>Coach type</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Any', 'Professional Coach', 'Former Elite Athlete', 'Club Coach', 'Certified Trainer'].map((value) => (
                <button key={value} onClick={() => updateFilter('coachType', value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${pillClass(filters.coachType === value)}`}>{value}</button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-dark/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-brand-accent" />
              <span>Sort by</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['highest-rated', 'lowest-price', 'highest-price', 'most-experienced', 'most-popular', 'recently-joined'].map((value) => (
                <button key={value} onClick={() => updateFilter('sortBy', value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${pillClass(filters.sortBy === value)}`}>{value.replace('-', ' ')}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-brand-border bg-brand-dark/80 p-4">
            <div>
              <div className="text-sm font-semibold text-white">Verified coaches only</div>
              <div className="text-[11px] text-brand-muted">Prioritize credentialed coaches and elite profiles.</div>
            </div>
            <button onClick={() => updateFilter('verifiedOnly', !filters.verifiedOnly)} className={`relative h-6 w-12 rounded-full p-1 transition ${filters.verifiedOnly ? 'bg-brand-accent' : 'bg-brand-border'}`}>
              <div className={`h-4 w-4 rounded-full bg-black transition-transform ${filters.verifiedOnly ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="border-t border-brand-border/60 pt-4">
          <button onClick={onClose} className="w-full rounded-xl bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-zinc-200">
            Apply Filters
          </button>
        </div>
      </motion.div>
    </div>
  );
};
