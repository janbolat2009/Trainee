import React from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, Target, Activity, Award, Mail, Phone, MapPin, Sparkles, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

export const AthleteProfileView: React.FC = () => {
  const { selectedAthlete, setActiveTab, setIsOnboardingOpen } = useApp();

  return (
    <div className="bg-brand-black min-h-screen pb-24 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Profile Banner */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <img 
              src={selectedAthlete.avatar} 
              alt={selectedAthlete.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-brand-accent shadow-glow-accent"
            />
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {selectedAthlete.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-accent/20 text-brand-accent border border-brand-accent/40 uppercase">
                  {selectedAthlete.skillLevel}
                </span>
              </div>

              <p className="text-xs font-mono text-zinc-400">
                {selectedAthlete.sport} • {selectedAthlete.specialization}
              </p>

              <div className="flex items-center space-x-3 text-xs text-brand-muted font-mono pt-1">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedAthlete.location}</span>
                </div>
                <span>•</span>
                <div>Age {selectedAthlete.age}</div>
                <span>•</span>
                <div className="text-brand-accent font-bold">{selectedAthlete.budgetRange}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-brand-card border border-brand-border text-white text-xs font-bold hover:bg-white/10 transition flex items-center space-x-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('matchmaking')}
              className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition shadow-glow-white flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>Find Match</span>
            </button>
          </div>

        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Bio, Goals & Skill Bars */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Bio Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-3">
              <h2 className="text-lg font-extrabold text-white uppercase tracking-tight">
                Athlete Overview
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                "{selectedAthlete.bio}"
              </p>
            </div>

            {/* Target Goals */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-4">
              <h2 className="text-lg font-extrabold text-white uppercase tracking-tight flex items-center space-x-2">
                <Target className="w-5 h-5 text-brand-accent" />
                <span>Primary Athletic Targets</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedAthlete.goals.map((goal, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-brand-dark border border-brand-border/60 flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-brand-accent/20 text-brand-accent mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs text-white font-medium">{goal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Proficiency Bar Breakdown */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-white uppercase tracking-tight flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-brand-accent" />
                  <span>Performance Vector Audit</span>
                </h2>
                <span className="text-xs font-mono text-brand-muted">SELF & AUDITED RATING</span>
              </div>

              <div className="space-y-4">
                {selectedAthlete.skillProficiency.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span className="text-zinc-200">{skill.name}</span>
                      <span className="text-brand-accent font-bold">{skill.score} / 100</span>
                    </div>
                    <div className="w-full h-2 bg-brand-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.score}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-zinc-400 via-white to-brand-accent rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column - Achievements & Contact */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Achievements Card */}
            <div className="glass-panel p-6 rounded-3xl border border-brand-border space-y-4">
              <h3 className="font-extrabold text-white text-base uppercase flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Career Highlights</span>
              </h3>
              <div className="space-y-2.5">
                {selectedAthlete.achievements.map((ach, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-brand-dark border border-brand-border text-xs text-zinc-300 font-medium">
                    🏆 {ach}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Card */}
            <div className="glass-panel p-6 rounded-3xl border border-brand-border space-y-3 font-mono text-xs text-brand-muted">
              <div className="font-bold text-white uppercase text-sm mb-2 font-sans">Contact Details</div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span>{selectedAthlete.contactNumber}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>{selectedAthlete.email}</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
