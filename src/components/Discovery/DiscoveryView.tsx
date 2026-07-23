import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FilterDrawer } from './FilterDrawer';
import { CoachCard } from './CoachCard';
import { MapSimulatedView } from './MapSimulatedView';
import { Search, SlidersHorizontal, LayoutGrid, List, Map, ShieldCheck, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export const DiscoveryView: React.FC = () => {
  const { filters, setFilters, resetFilters, coachesList } = useApp();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');

  const sports = ['All', 'Track & Field', 'Tennis', 'Football (Soccer)', 'Combat Sports', 'Swimming'];

  // Apply filters logic
  const filteredCoaches = coachesList.filter((coach) => {
    // Search query match
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchName = coach.name.toLowerCase().includes(q);
      const matchTitle = coach.title.toLowerCase().includes(q);
      const matchSport = coach.sport.toLowerCase().includes(q);
      const matchBio = coach.bio.toLowerCase().includes(q);
      if (!matchName && !matchTitle && !matchSport && !matchBio) return false;
    }

    // Sport filter
    if (filters.sport !== 'All') {
      if (coach.sport !== filters.sport && !coach.secondarySports.includes(filters.sport)) {
        return false;
      }
    }

    // Price filter
    if (coach.hourlyRate > filters.maxPrice) return false;

    // Verified only filter
    if (filters.verifiedOnly && !coach.isVerified) return false;

    // Coaching style filter
    if (filters.coachingStyle !== 'All' && coach.coachingStyle !== filters.coachingStyle) return false;

    // Availability filter
    if (filters.availability !== 'All' && coach.availability !== filters.availability) return false;

    return true;
  });

  return (
    <div className="py-8 bg-brand-black min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Explore Verified Coaches
          </h1>
          <p className="text-brand-muted text-sm mt-1">
            Discover credentialed sports performance specialists tailored to your sport and goals.
          </p>
        </div>

        {/* Search Bar & View Switcher Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-brand-border mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Input Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by coach name, biomechanics, sport, or location..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full bg-brand-dark border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-accent"
              />
            </div>

            {/* Controls Right */}
            <div className="flex items-center space-x-2">
              
              {/* Filter Drawer Trigger Button */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-brand-card border border-brand-border text-white text-xs font-semibold hover:bg-white/10 transition flex items-center space-x-2"
              >
                <SlidersHorizontal className="w-4 h-4 text-brand-accent" />
                <span>Filters</span>
                {(filters.sport !== 'All' || filters.verifiedOnly || filters.maxPrice < 200 || filters.coachingStyle !== 'All') && (
                  <span className="w-2 h-2 rounded-full bg-brand-accent" />
                )}
              </button>

              {/* View Switcher Buttons */}
              <div className="flex items-center p-1 rounded-xl bg-brand-dark border border-brand-border">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg text-xs transition ${
                    viewMode === 'grid' ? 'bg-white text-black font-bold' : 'text-brand-muted hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg text-xs transition ${
                    viewMode === 'list' ? 'bg-white text-black font-bold' : 'text-brand-muted hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-lg text-xs transition ${
                    viewMode === 'map' ? 'bg-white text-black font-bold' : 'text-brand-muted hover:text-white'
                  }`}
                  title="Map View"
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

          {/* Quick Sport Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pt-2 no-scrollbar">
            {sports.map((sp) => (
              <button
                key={sp}
                onClick={() => setFilters({ ...filters, sport: sp })}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  filters.sport === sp
                    ? 'bg-brand-accent text-black font-bold'
                    : 'bg-brand-dark border border-brand-border text-brand-muted hover:text-white'
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter & Reset */}
        <div className="flex items-center justify-between text-xs font-mono text-brand-muted mb-6">
          <div>
            SHOWING <span className="text-white font-bold">{filteredCoaches.length}</span> COACHES
          </div>
          {(filters.searchQuery || filters.sport !== 'All' || filters.verifiedOnly || filters.maxPrice < 200) && (
            <button
              onClick={resetFilters}
              className="text-brand-accent hover:underline flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear active filters</span>
            </button>
          )}
        </div>

        {/* Main Display Switcher */}
        {filteredCoaches.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-brand-border text-center space-y-4 max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-full bg-brand-card border border-brand-border flex items-center justify-center mx-auto text-brand-muted">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase">No Coaches Found</h3>
            <p className="text-xs text-brand-muted">
              No verified coaches match your current filter preferences. Try resetting or adjusting your max hourly price limit.
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'map' ? (
          <MapSimulatedView coaches={filteredCoaches} />
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredCoaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} viewMode={viewMode} />
            ))}
          </div>
        )}

      </div>

      {/* Slide-Up Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
      />
    </div>
  );
};
