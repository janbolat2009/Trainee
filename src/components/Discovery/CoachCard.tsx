import React from 'react';
import { Coach } from '../../types';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Star, MapPin, Bookmark, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface CoachCardProps {
  coach: Coach;
  viewMode: 'grid' | 'list';
}

export const CoachCard: React.FC<CoachCardProps> = ({ coach, viewMode }) => {
  const { viewCoachDetails, savedCoachIds, toggleSaveCoach } = useApp();
  const isSaved = savedCoachIds.includes(coach.id);

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        className="glass-panel p-5 rounded-2xl border border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition"
      >
        <div className="flex items-center space-x-4">
          <img 
            src={coach.avatar} 
            alt={coach.name}
            className="w-16 h-16 rounded-xl object-cover border border-brand-border flex-shrink-0" 
          />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base">{coach.name}</h3>
              {coach.isVerified && (
                <ShieldCheck className="w-4 h-4 text-brand-accent fill-brand-accent/20" />
              )}
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-brand-elevated text-brand-accent border border-brand-border">
                {coach.sport}
              </span>
            </div>
            <p className="text-xs text-brand-muted line-clamp-1 mt-0.5">{coach.title}</p>
            <div className="flex items-center space-x-3 text-xs text-brand-muted mt-2 font-mono">
              <div className="flex items-center space-x-1 text-white">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-bold">{coach.rating}</span>
                <span>({coach.reviewCount})</span>
              </div>
              <span>•</span>
              <span>{coach.yearsExperience} yrs exp</span>
              <span>•</span>
              <span>{coach.location}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end space-x-4 border-t md:border-t-0 pt-3 md:pt-0 border-brand-border/50">
          <div className="text-left md:text-right font-mono">
            <div className="text-lg font-bold text-white">${coach.hourlyRate}</div>
            <div className="text-[10px] text-brand-muted">per session</div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleSaveCoach(coach.id)}
              className={`p-2.5 rounded-xl border transition ${
                isSaved 
                  ? 'bg-brand-accent/20 border-brand-accent text-brand-accent' 
                  : 'bg-brand-card border-brand-border text-brand-muted hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-brand-accent' : ''}`} />
            </button>
            <button
              onClick={() => viewCoachDetails(coach)}
              className="px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition flex items-center space-x-1.5 shadow-glow-white"
            >
              <span>Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-zinc-700 transition relative group"
    >
      {/* Save Bookmark button top right */}
      <button
        onClick={() => toggleSaveCoach(coach.id)}
        className={`absolute top-4 right-4 p-2 rounded-xl border transition z-10 ${
          isSaved 
            ? 'bg-brand-accent/20 border-brand-accent text-brand-accent' 
            : 'bg-brand-black/60 border-brand-border text-brand-muted hover:text-white'
        }`}
      >
        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-brand-accent' : ''}`} />
      </button>

      <div>
        {/* Avatar & Header */}
        <div className="flex items-center space-x-3.5 mb-4">
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
            <span className="text-xs text-brand-accent font-mono font-semibold">{coach.sport}</span>
          </div>
        </div>

        {/* Title & Badge */}
        <div className="inline-block px-2.5 py-1 rounded bg-brand-elevated border border-brand-border text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-3">
          {coach.verificationBadge}
        </div>

        {/* Meta Specs */}
        <div className="space-y-1.5 text-xs text-brand-muted mb-4 font-mono">
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <MapPin className="w-3.5 h-3.5 text-brand-muted" />
            <span className="line-clamp-1">{coach.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px]">
            <div className="flex items-center space-x-1 text-white font-bold">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{coach.rating}</span>
            </div>
            <span>•</span>
            <span className="text-zinc-300">{coach.reviewCount} reviews</span>
            <span>•</span>
            <span className="text-zinc-300">{coach.yearsExperience} yrs</span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
          "{coach.bio}"
        </p>
      </div>

      {/* Footer Rate & CTA */}
      <div className="pt-4 border-t border-brand-border/60 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase text-brand-muted">Fee</div>
          <div className="text-base font-bold text-white font-mono">
            ${coach.hourlyRate} <span className="text-xs text-brand-muted font-normal">/ hr</span>
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
  );
};
