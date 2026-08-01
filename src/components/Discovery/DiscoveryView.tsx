import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FilterDrawer } from './FilterDrawer';
import { CoachCard } from './CoachCard';
import { MapSimulatedView } from './MapSimulatedView';
import { Search, SlidersHorizontal, LayoutGrid, List, Map, RotateCcw, DollarSign, MapPin, Users, Layers, CheckCircle2, X, Sparkles, Clock3, BriefcaseBusiness, Globe2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchActiveListings, applyToListing } from '../../services/coachListingService';
import type { CoachListing, Coach } from '../../types';

// ── Apply Modal ───────────────────────────────────────────────────────────────

const ApplyModal: React.FC<{
  listing: CoachListing;
  onClose: () => void;
  onApplied: () => void;
}> = ({ listing, onClose, onApplied }) => {
  const { currentProfile, addNotification } = useApp();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const athlete = currentProfile?.role !== 'coach' ? currentProfile?.profile : null;

  const handleApply = async () => {
    if (!athlete) return;
    setIsSubmitting(true);
    const ok = await applyToListing(
      listing.id,
      listing.coachId,
      athlete.id,
      athlete.name,
      athlete.avatar ?? null,
      message,
    );
    if (ok) {
      setSuccess(true);
      addNotification({ type: 'success', title: 'Application sent!', message: `Your application to "${listing.sport}" listing has been submitted.` });
      setTimeout(() => { onApplied(); onClose(); }, 1200);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-4 py-4 bg-black/70 backdrop-blur-md sm:py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-brand-card border border-brand-border rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-brand-border/60">
          <div>
            <h3 className="font-semibold text-white text-sm">Apply to Listing</h3>
            <p className="text-xs text-brand-muted mt-0.5">{listing.sport} • {listing.trainingFormat}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-brand-muted mb-1.5 block">Message to Coach (optional)</label>
            <textarea
              rows={4}
              placeholder="Introduce yourself, your goals, and why you'd like to work with this coach..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-brand-dark border border-brand-border rounded-xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-accent resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-brand-border text-xs font-medium text-brand-muted hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleApply()}
              disabled={isSubmitting || success || !athlete}
              className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {success ? <><CheckCircle2 className="w-4 h-4 text-emerald-500" />Sent!</> : isSubmitting ? 'Sending...' : 'Send Application'}
            </button>
          </div>
          {!athlete && (
            <p className="text-xs text-amber-400 text-center">Please log in as an athlete to apply.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ── Listing Card ──────────────────────────────────────────────────────────────

const ListingCard: React.FC<{ listing: CoachListing }> = ({ listing }) => {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const { currentProfile } = useApp();
  const isCoach = currentProfile?.role === 'coach';

  return (
    <>
      <motion.div
        whileHover={{ y: -2 }}
        className="glass-panel p-5 rounded-2xl border border-brand-border flex flex-col gap-3 hover:border-zinc-700 transition"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-white text-sm">{listing.sport}</h4>
            {listing.specialization && <p className="text-xs text-brand-muted">{listing.specialization}</p>}
          </div>
          <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border ${
            listing.trainingFormat === 'online' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
            listing.trainingFormat === 'hybrid' ? 'bg-brand-accent/15 text-brand-accent border-brand-accent/30' :
            'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
          } capitalize`}>
            {listing.trainingFormat}
          </span>
        </div>

        {listing.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{listing.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-brand-muted">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{listing.athleteLevel}</span>
          {listing.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{listing.location}</span>}
          <span className="flex items-center gap-1 text-brand-accent font-bold">
            <DollarSign className="w-3.5 h-3.5" />{listing.price} / {listing.billingPeriod}
          </span>
        </div>

        {!isCoach && (
          <button
            onClick={() => setIsApplyOpen(true)}
            disabled={applied}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold transition ${
              applied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                : 'bg-white text-black hover:bg-zinc-200 shadow-sm'
            }`}
          >
            {applied ? '✓ Applied' : 'Apply Now'}
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {isApplyOpen && (
          <ApplyModal
            listing={listing}
            onClose={() => setIsApplyOpen(false)}
            onApplied={() => setApplied(true)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ── Main View ─────────────────────────────────────────────────────────────────

export const DiscoveryView: React.FC = () => {
  const { filters, setFilters, resetFilters, coachesList } = useApp();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [listings, setListings] = useState<CoachListing[]>([]);
  const [activeSection, setActiveSection] = useState<'coaches' | 'listings'>('coaches');

  const sports = ['All', 'Track & Field', 'Tennis', 'Football (Soccer)', 'Combat Sports', 'Swimming', 'Basketball', 'Volleyball', 'Boxing', 'MMA', 'Athletics', 'Other'];

  useEffect(() => {
    void fetchActiveListings().then(setListings);
  }, []);

  const filteredCoaches = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();
    const normalizedLanguages = filters.languages.map((language) => language.toLowerCase());

    return coachesList.filter((coach) => {
      const searchableText = [
        coach.name,
        coach.title,
        coach.sport,
        coach.specialization ?? '',
        coach.country ?? '',
        coach.city ?? '',
        coach.bio,
        ...(coach.achievements ?? []),
        ...(coach.languages ?? []),
      ].join(' ').toLowerCase();

      if (query && !searchableText.includes(query)) return false;
      if (filters.sport !== 'All') {
        const sportMatches = [coach.sport, ...(coach.secondarySports ?? [])].some((value) => value.toLowerCase() === filters.sport.toLowerCase());
        if (!sportMatches) return false;
      }
      if (coach.hourlyRate < filters.priceRange.min || coach.hourlyRate > filters.priceRange.max) return false;
      if (filters.minRating > 0 && coach.rating < filters.minRating) return false;
      if (filters.verifiedOnly && !coach.isVerified) return false;
      if (filters.coachingStyle !== 'All' && coach.coachingStyle !== filters.coachingStyle) return false;
      if (filters.experience !== 'Any') {
        const years = coach.yearsExperience;
        if (filters.experience === '1-3' && !(years >= 1 && years <= 3)) return false;
        if (filters.experience === '3-5' && !(years > 3 && years <= 5)) return false;
        if (filters.experience === '5-10' && !(years > 5 && years <= 10)) return false;
        if (filters.experience === '10+' && years < 10) return false;
      }
      if (filters.availability !== 'All' && coach.availability !== filters.availability) return false;
      if (filters.availabilityWindow !== 'Any' && coach.availabilityWindow && coach.availabilityWindow.toLowerCase() !== filters.availabilityWindow.toLowerCase()) return false;
      if (filters.trainingFormat !== 'Any' && coach.trainingFormat && coach.trainingFormat.toLowerCase() !== filters.trainingFormat.toLowerCase()) return false;
      if (filters.coachType !== 'Any' && coach.coachType && coach.coachType.toLowerCase() !== filters.coachType.toLowerCase()) return false;
      if (normalizedLanguages.length > 0) {
        const coachLanguages = (coach.languages ?? []).map((language) => language.toLowerCase());
        const hasAllLanguages = normalizedLanguages.every((language) => coachLanguages.includes(language));
        if (!hasAllLanguages) return false;
      }
      return true;
    });
  }, [coachesList, filters]);

  const sortedCoaches = useMemo(() => {
    const list = [...filteredCoaches];
    switch (filters.sortBy) {
      case 'lowest-price':
        return list.sort((a, b) => a.hourlyRate - b.hourlyRate);
      case 'highest-price':
        return list.sort((a, b) => b.hourlyRate - a.hourlyRate);
      case 'most-experienced':
        return list.sort((a, b) => b.yearsExperience - a.yearsExperience);
      case 'most-popular':
        return list.sort((a, b) => (b.popularity ?? b.reviewCount) - (a.popularity ?? a.reviewCount));
      case 'recently-joined':
        return list.sort((a, b) => (b.joinedAt ?? '').localeCompare(a.joinedAt ?? ''));
      case 'highest-rated':
      default:
        return list.sort((a, b) => b.rating - a.rating);
    }
  }, [filteredCoaches, filters.sortBy]);

  const filteredListings = useMemo(() => listings.filter((l) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (!l.sport.toLowerCase().includes(q) && !(l.description ?? '').toLowerCase().includes(q) && !l.specialization.toLowerCase().includes(q)) return false;
    }
    if (filters.sport !== 'All' && l.sport !== filters.sport) return false;
    return true;
  }), [listings, filters.searchQuery, filters.sport]);

  const hasActiveFilters = Boolean(filters.searchQuery || filters.sport !== 'All' || filters.verifiedOnly || filters.minRating > 0 || filters.priceRange.max !== 250 || filters.priceRange.min !== 50 || filters.coachingStyle !== 'All' || filters.experience !== 'Any' || filters.availability !== 'All' || filters.availabilityWindow !== 'Any' || filters.trainingFormat !== 'Any' || filters.coachType !== 'Any' || filters.languages.length > 0 || filters.sortBy !== 'highest-rated');

  return (
    <div className="py-8 bg-brand-black min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-brand-accent/90">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Discovery Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mt-2">
            Explore Verified Coaches
          </h1>
          <p className="text-brand-muted text-sm mt-2 max-w-2xl">
            Find coaches by sport, language, experience, price, and availability in a single streamlined experience.
          </p>
        </motion.div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-brand-card border border-brand-border w-fit">
          <button
            onClick={() => setActiveSection('coaches')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${activeSection === 'coaches' ? 'bg-white text-black' : 'text-brand-muted hover:text-white'}`}
          >
            Coaches ({filteredCoaches.length})
          </button>
          <button
            onClick={() => setActiveSection('listings')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${activeSection === 'listings' ? 'bg-white text-black' : 'text-brand-muted hover:text-white'}`}
          >
            Open Listings ({filteredListings.length})
          </button>
        </div>

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4 rounded-2xl border border-brand-border mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by coach name, sport, or specialization..."
                value={filters.searchQuery}
                onChange={(e) => setFilters((previous) => ({ ...previous, searchQuery: e.target.value }))}
                className="w-full bg-brand-dark border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-accent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-brand-card border border-brand-border text-white text-xs font-semibold hover:bg-white/10 transition flex items-center space-x-2"
              >
                <SlidersHorizontal className="w-4 h-4 text-brand-accent" />
                <span>Filters</span>
                {(filters.sport !== 'All' || filters.verifiedOnly || filters.priceRange.max !== 250 || filters.priceRange.min !== 50 || filters.coachingStyle !== 'All') && (
                  <span className="w-2 h-2 rounded-full bg-brand-accent" />
                )}
              </button>

              {activeSection === 'coaches' && (
                <div className="flex items-center p-1 rounded-xl bg-brand-dark border border-brand-border">
                  {(['grid', 'list', 'map'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`p-2 rounded-lg text-xs transition ${viewMode === mode ? 'bg-white text-black font-bold' : 'text-brand-muted hover:text-white'}`}
                    >
                      {mode === 'grid' ? <LayoutGrid className="w-4 h-4" /> : mode === 'list' ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pt-2 no-scrollbar">
            {sports.map((sp) => (
              <button
                key={sp}
                onClick={() => setFilters((previous) => ({ ...previous, sport: sp }))}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  filters.sport === sp ? 'bg-brand-accent text-black font-bold' : 'bg-brand-dark border border-brand-border text-brand-muted hover:text-white'
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        <div className="flex items-center justify-between text-xs font-mono text-brand-muted mb-6">
          <div>
            SHOWING <span className="text-white font-bold">
              {activeSection === 'coaches' ? filteredCoaches.length : filteredListings.length}
            </span> {activeSection === 'coaches' ? 'COACHES' : 'LISTINGS'}
          </div>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-brand-accent hover:underline flex items-center space-x-1">
              <RotateCcw className="w-3 h-3" />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {/* Coaches Section */}
        <AnimatePresence mode="wait">
          {activeSection === 'coaches' && (
            <motion.div key="coaches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {filteredCoaches.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-12 rounded-3xl border border-brand-border text-center space-y-4 max-w-md mx-auto my-12">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-accent/30 bg-brand-accent/10 text-brand-accent">
                    <Search className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase">No coaches match your search.</h3>
                  <p className="text-xs text-brand-muted">Try widening the filters or resetting the discovery view to browse more coaches.</p>
                  <button onClick={resetFilters} className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition">
                    Reset Filters
                  </button>
                </motion.div>
              ) : viewMode === 'map' ? (
                <MapSimulatedView coaches={filteredCoaches} />
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {sortedCoaches.map((coach: Coach) => (
                    <CoachCard key={coach.id} coach={coach} viewMode={viewMode} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Listings Section */}
          {activeSection === 'listings' && (
            <motion.div key="listings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {filteredListings.length === 0 ? (
                <div className="glass-panel p-12 rounded-3xl border border-brand-border text-center space-y-4 max-w-md mx-auto my-12">
                  <Layers className="w-8 h-8 text-brand-muted mx-auto" />
                  <h3 className="text-lg font-bold text-white">No Open Listings</h3>
                  <p className="text-xs text-brand-muted">Coaches haven't published any active listings yet. Check back soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FilterDrawer isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} />
    </div>
  );
};
