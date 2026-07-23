import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MOCK_COACHES } from '../../data/mockData';
import { ShieldCheck, Star, ArrowRight, Sparkles, MapPin, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export const FeaturedCoaches: React.FC = () => {
  const { viewCoachDetails, setActiveTab } = useApp();
  const [selectedSport, setSelectedSport] = useState<string>('All');

  const sports = ['All', 'Track & Field', 'Tennis', 'Football (Soccer)', 'Combat Sports', 'Swimming'];

  const filteredCoaches = selectedSport === 'All' 
    ? MOCK_COACHES 
    : MOCK_COACHES.filter(c => c.sport === selectedSport || c.secondarySports.includes(selectedSport));

  return (
    <section className="py-20 bg-brand-dark/40 border-b border-brand-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header & Sport Selector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-card border border-brand-border text-xs font-mono text-brand-muted mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" />
              <span>VERIFIED MASTER COACHES</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white uppercase tracking-tight">
              Featured Verified Coaches
            </h2>
            <p className="text-brand-muted text-sm mt-1">
              Top-rated practitioners with verified international certifications & proven athlete outcomes.
            </p>
          </div>

          {/* Sport Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedSport === sport
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-brand-card border border-brand-border text-brand-muted hover:text-white'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>

        {/* Coaches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.slice(0, 3).map((coach) => (
            <motion.div
              key={coach.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-zinc-700 transition"
            >
              <div>
                {/* Header & Avatar */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={coach.avatar} 
                      alt={coach.name} 
                      className="w-14 h-14 rounded-xl object-cover border border-brand-border"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h3 className="font-bold text-white text-base">{coach.name}</h3>
                        {coach.isVerified && (
                          <ShieldCheck className="w-4 h-4 text-brand-accent fill-brand-accent/20" />
                        )}
                      </div>
                      <span className="text-xs text-brand-muted line-clamp-1">{coach.title}</span>
                    </div>
                  </div>
                </div>

                {/* Badge Tag */}
                <div className="inline-block px-2.5 py-1 rounded bg-brand-elevated border border-brand-border text-[10px] font-mono font-bold text-brand-accent uppercase tracking-wider mb-3">
                  {coach.verificationBadge}
                </div>

                {/* Info Pills */}
                <div className="space-y-2 text-xs text-brand-muted mb-4">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="line-clamp-1">{coach.location}</span>
                  </div>
                  <div className="flex items-center space-x-3 font-mono text-[11px]">
                    <div className="flex items-center space-x-1 text-white">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold">{coach.rating}</span>
                      <span className="text-brand-muted">({coach.reviewCount})</span>
                    </div>
                    <span>•</span>
                    <div className="text-zinc-300">{coach.yearsExperience} yrs exp</div>
                    <span>•</span>
                    <div className="text-zinc-300">{coach.athletesTrained}+ athletes</div>
                  </div>
                </div>

                {/* Bio Snippet */}
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                  "{coach.bio}"
                </p>
              </div>

              {/* Bottom Actions & Price */}
              <div className="pt-4 border-t border-brand-border/60 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-brand-muted uppercase">Rate</div>
                  <div className="text-lg font-bold text-white font-mono">
                    ${coach.hourlyRate} <span className="text-xs font-normal text-brand-muted">/ session</span>
                  </div>
                </div>

                <button
                  onClick={() => viewCoachDetails(coach)}
                  className="px-4 py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-zinc-200 transition flex items-center space-x-1.5"
                >
                  <span>View Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => setActiveTab('discovery')}
            className="px-8 py-3.5 rounded-xl bg-brand-card border border-brand-border text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 hover:border-zinc-600 transition inline-flex items-center space-x-2"
          >
            <span>Explore All 1,200+ Verified Coaches</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
