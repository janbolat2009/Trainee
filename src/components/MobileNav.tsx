import React from 'react';
import { useApp, ActiveTab } from '../context/AppContext';
import { Home, Search, Sparkles, User, Bot, LayoutDashboard, Users, FileText, Bell, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export const MobileNav: React.FC = () => {
  const {
    activeTab, setActiveTab, isCopilotOpen, setIsCopilotOpen,
    isChatOpen, setIsChatOpen, currentProfile, unreadCount, totalUnreadChatCount,
    isAuthenticated,
  } = useApp();
  const isCoach = currentProfile?.role === 'coach';

  const athleteItems: { id: ActiveTab | 'copilot' | 'chat'; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'discovery', label: 'Search', icon: <Search className="w-5 h-5" /> },
    {
      id: 'chat',
      label: 'Chat',
      icon: (
        <div className="relative">
          <MessageSquare className="w-5 h-5 text-brand-accent" />
          {totalUnreadChatCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-accent text-[8px] font-bold text-black">
              {totalUnreadChatCount > 9 ? '9+' : totalUnreadChatCount}
            </span>
          )}
        </div>
      ),
    },
    { id: 'athlete-profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'copilot', label: 'Copilot', icon: <Bot className="w-5 h-5 text-brand-accent" /> },
  ];

  const coachItems: { id: ActiveTab | 'copilot' | 'chat'; label: string; icon: React.ReactNode }[] = [
    { id: 'coach-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'coach-profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'coach-listings', label: 'Listings', icon: <FileText className="w-5 h-5" /> },
    {
      id: 'chat',
      label: 'Chat',
      icon: (
        <div className="relative">
          <MessageSquare className="w-5 h-5 text-brand-accent" />
          {totalUnreadChatCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-accent text-[8px] font-bold text-black">
              {totalUnreadChatCount > 9 ? '9+' : totalUnreadChatCount}
            </span>
          )}
        </div>
      ),
    },
    { id: 'copilot', label: 'Copilot', icon: <Bot className="w-5 h-5 text-brand-accent" /> },
  ];

  const items = isCoach ? coachItems : athleteItems;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto bg-brand-black/90 backdrop-blur-xl border border-brand-border/80 rounded-2xl p-1.5 shadow-2xl flex items-center justify-around">
        {items.map((item) => {
          const isCopilot = item.id === 'copilot';
          const isChat = item.id === 'chat';
          const isActive = isCopilot ? isCopilotOpen : isChat ? isChatOpen : activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isCopilot) {
                  setIsCopilotOpen(!isCopilotOpen);
                } else if (isChat) {
                  setIsChatOpen(!isChatOpen);
                } else {
                  setActiveTab(item.id as ActiveTab);
                }
              }}
              className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl text-[10px] font-medium transition-all ${
                isActive ? 'text-white font-bold' : 'text-brand-muted hover:text-zinc-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavBg"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10">{item.icon}</div>
              <span className="relative z-10 mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
