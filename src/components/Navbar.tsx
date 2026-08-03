import React from 'react';
import { motion } from 'framer-motion';
import { Bot, LogOut, MessageSquare, User, Bell, PlusSquare } from 'lucide-react';

import { type ActiveTab, useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    activeTab, setActiveTab, setIsOnboardingOpen, setIsLoginOpen,
    isCopilotOpen, setIsCopilotOpen, isChatOpen, setIsChatOpen,
    isAuthenticated, currentUser, currentProfile, logout, unreadCount,
    totalUnreadChatCount, setIsCreateListingOpen, setIsNotificationsOpen,
  } = useApp();

  const isCoach = currentProfile?.role === 'coach';
  const profileTab: ActiveTab = isCoach ? 'coach-profile' : 'athlete-profile';
  const profileName = currentProfile?.profile.name ?? currentUser?.email?.split('@')[0] ?? 'Account';
  const profileAvatar = currentProfile?.profile.avatar;

  const navItems: { id: ActiveTab; label: string }[] = isCoach
    ? [
        { id: 'home', label: 'Home' },
        { id: 'coach-dashboard', label: 'Dashboard' },
        { id: 'coach-profile', label: 'My Profile' },
        { id: 'coach-listings', label: 'My Listings' },
        { id: 'coach-applications', label: 'Applications' },
        { id: 'coach-students', label: 'Students' },
      ]
    : [
        { id: 'home', label: 'Home' },
        { id: 'discovery', label: 'Coaches' },
        { id: 'matchmaking', label: 'Match' },
        { id: profileTab, label: isAuthenticated ? 'Profile' : 'Athlete hub' },
      ];

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="glass-panel mx-auto flex h-14 max-w-7xl items-center justify-between rounded-2xl px-3 sm:px-4">
        <button onClick={() => setActiveTab(isCoach ? 'coach-dashboard' : 'home')} className="group flex items-center gap-2.5" aria-label="Go to homepage">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm font-black tracking-tighter text-black transition-transform duration-300 group-hover:rotate-6">T.</span>
          <span className="hidden text-sm font-extrabold tracking-[0.16em] text-white sm:inline">TRAINEE</span>
        </button>

        <nav className="hidden items-center gap-1 rounded-xl bg-black/20 p-1 md:flex">
          {navItems.map((item) => {
            const selected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition ${selected ? 'text-white' : 'text-zinc-400 hover:text-zinc-100'}`}
              >
                {selected && <motion.span layoutId="navbar-active" className="absolute inset-0 rounded-lg bg-white/10" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Coach quick action: Add listing */}
          {isCoach && isAuthenticated && (
            <button
              onClick={() => setIsCreateListingOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-1.5 text-xs font-semibold text-brand-accent transition hover:bg-brand-accent/20"
              title="Create new listing"
            >
              <PlusSquare className="h-3.5 w-3.5" />
              <span>New Listing</span>
            </button>
          )}

          {/* In-App Chat Trigger */}
          {isAuthenticated && (
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`relative flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                isChatOpen
                  ? 'border-brand-accent/40 bg-brand-accent/15 text-brand-accent'
                  : 'border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
              title="Direct Messages"
              aria-label="Open Chat"
            >
              <MessageSquare className="h-4 w-4" />
              {totalUnreadChatCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[9px] font-bold text-black">
                  {totalUnreadChatCount > 9 ? '9+' : totalUnreadChatCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications bell */}
          {isAuthenticated && (
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isCopilotOpen ? 'border-brand-accent/40 bg-brand-accent/15 text-brand-accent' : 'border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'}`}
            aria-label="Toggle copilot"
          >
            <Bot className="h-4 w-4" />
          </button>

          {isAuthenticated ? (
            <>
              <button onClick={() => setActiveTab(profileTab)} className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-white/10" title="Open your profile">
                {profileAvatar ? <img src={profileAvatar} alt="" className="h-7 w-7 rounded-lg object-cover" /> : <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10"><User className="h-4 w-4" /></span>}
                <span className="hidden max-w-28 truncate text-xs font-medium text-zinc-100 sm:inline">{profileName}</span>
              </button>
              <button onClick={() => void logout()} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white" aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setIsLoginOpen(true)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:text-white">Log in</button>
              <button onClick={() => setIsOnboardingOpen(true)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-zinc-200">Create account</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
