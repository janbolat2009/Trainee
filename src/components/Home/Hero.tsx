import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, MapPin, ShieldCheck, Sparkles, Star } from 'lucide-react';

import { useApp } from '../../context/AppContext';

export const Hero: React.FC = () => {
  const { setActiveTab, coachesList } = useApp();
  const featuredCoach = coachesList[0];

  return (
    <section className="liquid-shell relative overflow-hidden border-b border-white/[0.07] py-16 sm:py-24">
      <div className="liquid-orb absolute -left-24 top-8 h-72 w-72 rounded-full bg-brand-accent/[0.08] blur-3xl" />
      <div className="liquid-orb absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-400/[0.08] blur-3xl [animation-delay:-6s]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <p className="section-eyebrow mb-5">One place for serious training</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-white sm:text-6xl">
            Find a coach who understands how you train.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
            Explore verified specialists, compare their approach, and build a training plan that fits your goals.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => setActiveTab('discovery')} className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-200">
              Explore coaches <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button onClick={() => setActiveTab('matchmaking')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-5 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.09] hover:text-white">
              <Sparkles className="h-4 w-4 text-brand-accent" /> Find my match
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-400">
            {['Verified credentials', 'Clear pricing', 'Built around your sport'].map((item) => (
              <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-accent" />{item}</span>
            ))}
          </div>
        </motion.div>

        {featuredCoach && (
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="glass-panel-elevated relative overflow-hidden rounded-3xl p-5 sm:p-6">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <p className="section-eyebrow mb-5">A good fit, at a glance</p>
            <div className="flex items-start gap-4">
              <img src={featuredCoach.avatar} alt={featuredCoach.name} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/15" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5"><h2 className="truncate text-base font-semibold text-white">{featuredCoach.name}</h2><ShieldCheck className="h-4 w-4 shrink-0 text-brand-accent" /></div>
                <p className="mt-1 truncate text-sm text-zinc-400">{featuredCoach.title}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400"><span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />{featuredCoach.rating}</span><span className="flex min-w-0 items-center gap-1 truncate"><MapPin className="h-3.5 w-3.5" />{featuredCoach.location}</span></div>
              </div>
            </div>
            <div className="my-5 h-px bg-white/[0.08]" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-lg font-semibold text-white">{featuredCoach.yearsExperience}</p><p className="text-[10px] text-zinc-500">years coaching</p></div>
              <div><p className="text-lg font-semibold text-white">{featuredCoach.athletesTrained}+</p><p className="text-[10px] text-zinc-500">athletes trained</p></div>
              <div><p className="text-lg font-semibold text-white">${featuredCoach.hourlyRate}</p><p className="text-[10px] text-zinc-500">per session</p></div>
            </div>
            <button onClick={() => setActiveTab('matchmaking')} className="mt-5 w-full rounded-xl bg-white/[0.09] py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.15]">See why this coach fits</button>
          </motion.div>
        )}
      </div>
    </section>
  );
};
