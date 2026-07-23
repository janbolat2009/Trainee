import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { Hero } from './components/Home/Hero';
import { HowItWorks } from './components/Home/HowItWorks';
import { FeaturedCoaches } from './components/Home/FeaturedCoaches';
import { DualCTA } from './components/Home/DualCTA';
import { DiscoveryView } from './components/Discovery/DiscoveryView';
import { MatchmakingView } from './components/Matchmaking/MatchmakingView';
import { CoachProfileView } from './components/Profile/CoachProfileView';
import { AthleteProfileView } from './components/Profile/AthleteProfileView';
import { OnboardingModal } from './components/Onboarding/OnboardingModal';
import { AICopilotDrawer } from './components/AICopilot/AICopilotDrawer';
import { ShieldCheck, Sparkles, Heart } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <main className="min-h-screen">
      {activeTab === 'home' && (
        <>
          <Hero />
          <HowItWorks />
          <FeaturedCoaches />
          <DualCTA />
        </>
      )}

      {activeTab === 'discovery' && <DiscoveryView />}
      {activeTab === 'matchmaking' && <MatchmakingView />}
      {activeTab === 'coach-profile' && <CoachProfileView />}
      {activeTab === 'athlete-profile' && <AthleteProfileView />}
    </main>
  );
};

const Footer: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <footer className="border-t border-brand-border/60 bg-brand-black text-brand-muted py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-lg tracking-widest text-white uppercase font-sans">
              TRAINEE<span className="text-brand-accent">™</span>
            </span>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-xs">
            The premier AI-powered marketplace connecting ambitious athletes with elite verified sports coaches.
          </p>
          <div className="flex items-center space-x-1.5 text-[11px] text-brand-accent font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VERIFIED AUDIT GUARANTEE</span>
          </div>
        </div>

        <div>
          <div className="font-bold text-white uppercase font-mono tracking-wider mb-3">Platform</div>
          <ul className="space-y-2">
            <li><button onClick={() => setActiveTab('discovery')} className="hover:text-white transition">Explore Verified Coaches</button></li>
            <li><button onClick={() => setActiveTab('matchmaking')} className="hover:text-white transition">AI Matchmaker Engine</button></li>
            <li><button onClick={() => setActiveTab('athlete-profile')} className="hover:text-white transition">Athlete Hub</button></li>
          </ul>
        </div>

        <div>
          <div className="font-bold text-white uppercase font-mono tracking-wider mb-3">Sports Categories</div>
          <ul className="space-y-2">
            <li><span className="text-zinc-400">Track & Field / Sprinting</span></li>
            <li><span className="text-zinc-400">Tennis Mechanics</span></li>
            <li><span className="text-zinc-400">Football Positional IQ</span></li>
            <li><span className="text-zinc-400">Combat & Striking</span></li>
            <li><span className="text-zinc-400">Aquatics & Swimming</span></li>
          </ul>
        </div>

        <div>
          <div className="font-bold text-white uppercase font-mono tracking-wider mb-3">Legal & Security</div>
          <ul className="space-y-2 text-zinc-500 font-mono text-[11px]">
            <li><span>Terms of Service</span></li>
            <li><span>Privacy Policy</span></li>
            <li><span>Certification Audit Protocol</span></li>
            <li><span>© 2026 TRAINEE Inc. All rights reserved.</span></li>
          </ul>
        </div>

      </div>
    </footer>
  );
};

export function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-brand-black text-brand-light flex flex-col font-sans selection:bg-brand-accent selection:text-black">
        <Navbar />
        <div className="flex-1">
          <MainContent />
        </div>
        <Footer />
        <MobileNav />
        <OnboardingModal />
        <AICopilotDrawer />
      </div>
    </AppProvider>
  );
}

export default App;
