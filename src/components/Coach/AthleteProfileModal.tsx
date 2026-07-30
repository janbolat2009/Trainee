import React from 'react';
import { X, MapPin, Sparkles, Target, Activity } from 'lucide-react';
import type { Athlete } from '../../types';

interface AthleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: Athlete | null;
}

export const AthleteProfileModal: React.FC<AthleteProfileModalProps> = ({ isOpen, onClose, athlete }) => {
  if (!isOpen || !athlete) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-[28px] bg-[#111318] border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-muted">Athlete profile</p>
            <h2 className="mt-2 text-xl font-extrabold text-white">{athlete.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-brand-muted hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-6 p-6">
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-brand-dark p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <img
                  src={athlete.avatar}
                  alt={athlete.name}
                  className="h-24 w-24 rounded-3xl object-cover ring-1 ring-white/10"
                />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-brand-muted">
                    <Target className="w-4 h-4" />
                    <span>{athlete.skillLevel}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{athlete.sport}</div>
                  <div className="text-sm text-zinc-400">{athlete.specialization}</div>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-zinc-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-accent" />
                  <span>{athlete.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-accent" />
                  <span>{athlete.budgetRange}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-accent" />
                  <span>{athlete.goals.length > 0 ? athlete.goals[0] : 'Goals not provided'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-brand-dark p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white">About athlete</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{athlete.bio || 'No profile description available.'}</p>
            </div>

            {athlete.goals.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-brand-dark p-5">
                <h3 className="text-sm font-semibold text-white">Training goals</h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {athlete.goals.map((goal, idx) => (
                    <div key={idx} className="rounded-2xl border border-brand-border bg-[#0d1016] p-4 text-sm text-zinc-300">
                      {goal}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d1016] p-5 space-y-4">
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-muted">Quick facts</div>
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>Age</span>
                <span>{athlete.age || '—'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>Location</span>
                <span>{athlete.location}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>Skill level</span>
                <span>{athlete.skillLevel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Budget</span>
                <span>{athlete.budgetRange}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
