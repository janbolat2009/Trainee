import React from 'react';
import { useApp, ActiveTab } from '../context/AppContext';
import { Sparkles, Search, User, ShieldCheck, Zap, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setIsOnboardingOpen, 
    isCopilotOpen, 
    setIsCopilotOpen,
    userRole,
    setUserRole
  } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: <Zap className="w-4 h-4" /> },
    { id: 'discovery', label: 'Explore Coaches', icon: <Search className="w-4 h-4" /> },
    { id: 'matchmaking', label: 'AI Matchmaker', icon: <Sparkles className="w-4 h-4 text-brand-accent" />, badge: 'AI' },
    { id: 'athlete-profile', label: 'Athlete Hub', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-border/60 bg-brand-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white via-zinc-200 to-zinc-500 p-[1px]">
            <div className="w-full h-full bg-brand-black rounded-[7px] flex items-center justify-center font-extrabold text-white text-lg tracking-tighter">
              TR<span className="text-brand-accent">.</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-widest text-white uppercase font-sans">
              TRAINEE<span className="text-brand-accent">™</span>
            </span>
            <span className="text-[9px] font-mono tracking-wider text-brand-muted uppercase -mt-1 hidden sm:inline-block">
              AI MATCHMAKING MARKETPLACE
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 flex items-center space-x-2 ${
                  isActive 
                    ? 'text-white bg-brand-card border border-brand-border' 
                    : 'text-brand-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-brand-accent/20 text-brand-accent rounded border border-brand-accent/30">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-brand-accent rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Quick Role Toggle pill */}
          <button
            onClick={() => setUserRole(userRole === 'athlete' ? 'coach' : 'athlete')}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-brand-card border border-brand-border text-brand-muted hover:text-white hover:border-zinc-700 transition"
            title="Toggle viewing state between Athlete & Coach"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
            <span>Mode: <strong className="text-white">{userRole}</strong></span>
          </button>

          {/* AI Copilot Trigger Button */}
          <button
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 border ${
              isCopilotOpen 
                ? 'bg-brand-accent/20 text-brand-accent border-brand-accent/50 shadow-glow-accent'
                : 'bg-brand-card text-brand-light border-brand-border hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-spin-slow" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Join / Registration CTA */}
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-zinc-200 transition flex items-center space-x-1.5 shadow-glow-white"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>
    </header>
  );
};
