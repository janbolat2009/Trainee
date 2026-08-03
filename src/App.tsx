import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { Hero } from './components/Home/Hero';
import { DashboardSection } from './components/Home/DashboardSection';
import { HowItWorks } from './components/Home/HowItWorks';
import { FeaturedCoaches } from './components/Home/FeaturedCoaches';
import { DualCTA } from './components/Home/DualCTA';
import { DiscoveryView } from './components/Discovery/DiscoveryView';
import { MatchmakingView } from './components/Matchmaking/MatchmakingView';
import { CoachProfileView } from './components/Profile/CoachProfileView';
import { AthleteProfileView } from './components/Profile/AthleteProfileView';
import { OnboardingModal } from './components/Onboarding/OnboardingModal';
import { AICopilotDrawer } from './components/AICopilot/AICopilotDrawer';
import { ChatDrawer } from './components/Chat/ChatDrawer';
import { ShieldCheck } from 'lucide-react';
import { LoginModal } from './components/Auth/LoginModal';
import { AnimatePresence } from 'framer-motion';

// Coach-specific views
import { CoachDashboardView } from './components/Coach/CoachDashboardView';
import { CoachListingsView } from './components/Coach/CoachListingsView';
import { CoachApplicationsView } from './components/Coach/CoachApplicationsView';
import { CoachStudentsView } from './components/Coach/CoachStudentsView';
import { CreateListingModal } from './components/Coach/CreateListingModal';
import { VideoMeetingModal } from './components/Meetings/VideoMeetingModal';
import { NotificationCenter } from './components/Notifications/NotificationCenter';

const MainContent: React.FC = () => {
  const { activeTab, currentProfile, userRole, setActiveTab } = useApp();
  const isCoach = userRole === 'coach' || currentProfile?.role === 'coach';

  React.useEffect(() => {
    if (isCoach && activeTab === 'home') {
      setActiveTab('coach-dashboard');
    }
  }, [isCoach, activeTab, setActiveTab]);

  return (
    <main className="min-h-screen">
      {!isCoach && activeTab === 'home' && (
        <>
          <Hero />
          <DashboardSection />
          <HowItWorks />
          <FeaturedCoaches />
          <DualCTA />
        </>
      )}

      {isCoach && activeTab === 'home' && <CoachDashboardView />}

      {activeTab === 'discovery' && <DiscoveryView />}
      {activeTab === 'matchmaking' && <MatchmakingView />}
      {activeTab === 'coach-profile' && <CoachProfileView />}
      {activeTab === 'athlete-profile' && <AthleteProfileView />}

      {/* Coach-specific routes */}
      {activeTab === 'coach-dashboard' && <CoachDashboardView />}
      {activeTab === 'coach-listings' && <CoachListingsView />}
      {activeTab === 'coach-applications' && <CoachApplicationsView />}
      {activeTab === 'coach-students' && <CoachStudentsView />}
    </main>
  );
};

const Footer: React.FC = () => {
  const { setActiveTab, currentProfile } = useApp();
  const isCoach = currentProfile?.role === 'coach';
  const ownProfileTab = isCoach ? 'coach-profile' : 'athlete-profile';

  return (
    <footer className="border-t border-white/[0.07] px-4 py-8 text-xs text-zinc-500 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><span className="font-semibold tracking-[0.14em] text-zinc-200">TRAINEE</span><span>© 2026</span></div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {!isCoach && (
            <button onClick={() => setActiveTab('home')} className="transition hover:text-white">Home</button>
          )}
          {isCoach && (
            <button onClick={() => setActiveTab('coach-dashboard')} className="transition hover:text-white">Dashboard</button>
          )}
          <button onClick={() => setActiveTab('discovery')} className="transition hover:text-white">Coaches</button>
          {!isCoach && (
            <button onClick={() => setActiveTab('matchmaking')} className="transition hover:text-white text-brand-accent font-semibold">AI Matchmaking</button>
          )}
          {isCoach && (
            <button onClick={() => setActiveTab('coach-listings')} className="transition hover:text-white">My Listings</button>
          )}
          <button onClick={() => setActiveTab(ownProfileTab)} className="transition hover:text-white">My Profile</button>
          <span className="hidden items-center gap-1.5 text-zinc-400 sm:flex"><ShieldCheck className="h-3.5 w-3.5 text-brand-accent" />Verified profiles</span>
        </div>
      </div>
    </footer>
  );
};

// Global CreateListingModal — accessible from anywhere via context
const GlobalCoachModals: React.FC = () => {
  const { isCreateListingOpen, setIsCreateListingOpen, currentProfile } = useApp();
  if (currentProfile?.role !== 'coach') return null;

  return (
    <AnimatePresence>
      {isCreateListingOpen && (
        <CreateListingModal
          isOpen={isCreateListingOpen}
          onClose={() => setIsCreateListingOpen(false)}
          onSaved={() => {
            setIsCreateListingOpen(false);
          }}
        />
      )}
    </AnimatePresence>
  );
};

const GlobalMeetingModal: React.FC = () => {
  const { activeMeetingBooking, setActiveMeetingBooking } = useApp();

  return (
    <VideoMeetingModal booking={activeMeetingBooking} onClose={() => setActiveMeetingBooking(null)} />
  );
};

export function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-brand-black text-brand-light flex flex-col font-sans selection:bg-brand-accent/30 selection:text-white">
        <Navbar />
        <div className="flex-1">
          <MainContent />
        </div>
        <Footer />
        <MobileNav />
        <OnboardingModal />
        <LoginModal />
        <AICopilotDrawer />
        <ChatDrawer />
        <GlobalCoachModals />
        <GlobalMeetingModal />
        <NotificationCenter />
      </div>
    </AppProvider>
  );
}

export default App;
