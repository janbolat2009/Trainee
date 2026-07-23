import React, { useState } from 'react';
import { Coach } from '../../types';
import { useApp } from '../../context/AppContext';
import { MapPin, ShieldCheck, Star, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MapViewProps {
  coaches: Coach[];
}

export const MapSimulatedView: React.FC<MapViewProps> = ({ coaches }) => {
  const { viewCoachDetails } = useApp();
  const [activeCoachPin, setActiveCoachPin] = useState<Coach | null>(coaches[0] || null);

  // Simulated map coordinates for realistic layout
  const mapCoordinates = [
    { top: '35%', left: '42%' },
    { top: '28%', left: '68%' },
    { top: '60%', left: '30%' },
    { top: '52%', left: '75%' },
    { top: '70%', left: '55%' },
  ];

  return (
    <div className="relative w-full h-[550px] bg-brand-dark rounded-3xl border border-brand-border overflow-hidden grid-bg shadow-2xl">
      
      {/* Dark Map Vector Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-brand-black/40 pointer-events-none" />

      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-card/90 border border-brand-border text-xs font-mono text-zinc-300 backdrop-blur-md">
        <MapPin className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
        <span>RADAR MAP ACTIVE</span>
        <span className="text-brand-muted">•</span>
        <span>{coaches.length} COACHES LOCATED</span>
      </div>

      {/* Map Pins */}
      {coaches.map((coach, idx) => {
        const coords = mapCoordinates[idx % mapCoordinates.length];
        const isSelected = activeCoachPin?.id === coach.id;

        return (
          <button
            key={coach.id}
            onClick={() => setActiveCoachPin(coach)}
            style={{ top: coords.top, left: coords.left }}
            className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ${
              isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
            }`}
          >
            <div className="relative group">
              
              {/* Pulse ring for active pin */}
              {isSelected && (
                <div className="absolute -inset-2 rounded-full bg-brand-accent/30 animate-ping" />
              )}

              <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border shadow-xl backdrop-blur-md font-mono text-xs font-bold transition ${
                isSelected 
                  ? 'bg-brand-accent text-black border-white shadow-glow-accent'
                  : 'bg-brand-card text-white border-brand-border hover:border-zinc-500'
              }`}>
                <img 
                  src={coach.avatar} 
                  alt={coach.name}
                  className="w-5 h-5 rounded-full object-cover" 
                />
                <span>${coach.hourlyRate}</span>
              </div>
            </div>
          </button>
        );
      })}

      {/* Selected Coach Popup Card (Bottom Left or Floating) */}
      <AnimatePresence>
        {activeCoachPin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-30 glass-panel-elevated p-5 rounded-2xl border border-brand-border shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={activeCoachPin.avatar} 
                  alt={activeCoachPin.name} 
                  className="w-12 h-12 rounded-xl object-cover border border-brand-border"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="font-bold text-white text-sm">{activeCoachPin.name}</h4>
                    {activeCoachPin.isVerified && (
                      <ShieldCheck className="w-4 h-4 text-brand-accent fill-brand-accent/20" />
                    )}
                  </div>
                  <span className="text-xs text-brand-accent font-mono">{activeCoachPin.sport}</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-xs font-mono text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{activeCoachPin.rating}</span>
              </div>
            </div>

            <p className="text-xs text-brand-muted line-clamp-2 my-3">
              "{activeCoachPin.bio}"
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-brand-border/60">
              <div className="text-xs font-mono">
                <span className="text-white font-bold">${activeCoachPin.hourlyRate}</span>
                <span className="text-brand-muted"> / session</span>
              </div>
              <button
                onClick={() => viewCoachDetails(activeCoachPin)}
                className="px-3.5 py-1.5 rounded-lg bg-white text-black font-bold text-xs hover:bg-zinc-200 transition flex items-center space-x-1"
              >
                <span>Full Profile</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
