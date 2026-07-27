import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Star, ArrowRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export const FeaturedCoaches: React.FC = () => {
  const { viewCoachDetails, setActiveTab, coachesList } = useApp();
  const [selectedSport, setSelectedSport] = useState<string>('All');

  const sports = ['All', 'Track & Field', 'Tennis', 'Football (Soccer)', 'Combat Sports', 'Swimming'];

  const filteredCoaches = selectedSport === 'All' 
    ? coachesList
    : coachesList.filter(c => c.sport === selectedSport || c.secondarySports.includes(selectedSport));

  return (
    <section className="relative border-b border-white/[0.07] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header & Sport Selector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <p className="section-eyebrow mb-3">Selected specialists</p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white">Meet coaches worth your time.</h2>
            <p className="mt-2 text-sm text-zinc-400">Verified credentials, clear expertise, and a training style you can assess.</p>
          </div>

          {/* Sport Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedSport === sport
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'border border-white/10 bg-white/[0.035] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
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
              whileHover={{ y: -5 }}
              transition={{ duration: 0.25 }}
              className="glass-panel group flex flex-col justify-between rounded-3xl p-5 transition hover:border-white/20"
            >
              <div>
                {/* Header & Avatar */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={coach.avatar} 
                      alt={coach.name} 
                      className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/15"
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
                <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                  {coach.bio}
                </p>
              </div>

              {/* Bottom Actions & Price */}
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
                <div>
                  <div className="text-[10px] text-brand-muted uppercase">Rate</div>
                  <div className="text-lg font-bold text-white font-mono">
                    ${coach.hourlyRate} <span className="text-xs font-normal text-brand-muted">/ session</span>
                  </div>
                </div>

                <button
                  onClick={() => viewCoachDetails(coach)}
                  className="flex items-center space-x-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
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
            className="inline-flex items-center space-x-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-semibold text-white transition hover:bg-white/[0.09]"
          >
            <span>Browse all coaches</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
