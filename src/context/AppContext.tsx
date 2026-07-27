import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import type { Athlete, Coach, FilterState, UserRole } from '../types';
import { MOCK_ATHLETES, MOCK_COACHES } from '../data/mockData';
import { supabase } from '../lib/supabase';
import {
  fetchAuthenticatedProfile,
  fetchProfileData,
  type AuthenticatedProfile,
} from '../services/profileService';

export type ActiveTab =
  | 'home'
  | 'discovery'
  | 'matchmaking'
  | 'coach-profile'
  | 'athlete-profile'
  | 'coach-dashboard'
  | 'coach-listings'
  | 'coach-applications'
  | 'coach-students';

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'risk';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  selectedCoach: Coach;
  setSelectedCoach: (coach: Coach) => void;
  selectedAthlete: Athlete;
  setSelectedAthlete: (athlete: Athlete) => void;
  currentProfile: AuthenticatedProfile | null;
  isAuthLoading: boolean;
  refreshAuthenticatedProfile: (user?: User) => Promise<boolean>;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  totalUnreadChatCount: number;
  setTotalUnreadChatCount: (count: number) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  savedCoachIds: string[];
  toggleSaveCoach: (coachId: string) => void;
  viewCoachDetails: (coach: Coach) => void;
  coachesList: Coach[];
  setCoachesList: React.Dispatch<React.SetStateAction<Coach[]>>;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  isLoginOpen: boolean;
  setIsLoginOpen: (open: boolean) => void;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  clearNotifications: () => void;
  unreadCount: number;
  // Coach onboarding: trigger listing creation after registration
  isCreateListingOpen: boolean;
  setIsCreateListingOpen: (open: boolean) => void;
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '', sport: 'All', location: '', maxPrice: 200, minRating: 0,
  skillLevel: 'All', coachingStyle: 'All', verifiedOnly: false, availability: 'All',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [userRole, setUserRole] = useState<UserRole>('athlete');
  const [selectedCoach, setSelectedCoach] = useState<Coach>(MOCK_COACHES[0]);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete>(MOCK_ATHLETES[0]);
  const [currentProfile, setCurrentProfile] = useState<AuthenticatedProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [totalUnreadChatCount, setTotalUnreadChatCount] = useState(0);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [savedCoachIds, setSavedCoachIds] = useState<string[]>(['coach-1', 'coach-2']);
  const [coachesList, setCoachesList] = useState<Coach[]>(MOCK_COACHES);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    setNotifications((prev) => [
      {
        ...n,
        id: `notif-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      },
      ...prev,
    ]);
  };

  const clearNotifications = () => setNotifications([]);

  const applyAuthenticatedProfile = (profile: AuthenticatedProfile) => {
    setCurrentProfile(profile);
    setUserRole(profile.role);

    if (profile.role === 'coach') {
      setSelectedCoach(profile.profile);
      setActiveTab('coach-dashboard');
    } else {
      setSelectedAthlete(profile.profile);
      setActiveTab('athlete-profile');
    }
  };

  const clearAuthenticatedProfile = () => {
    setCurrentProfile(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setUserRole('athlete');
    setSelectedCoach(MOCK_COACHES[0]);
    setSelectedAthlete(MOCK_ATHLETES[0]);
    setNotifications([]);
    setIsChatOpen(false);
    setTotalUnreadChatCount(0);
  };

  const refreshAuthenticatedProfile = async (user?: User): Promise<boolean> => {
    const profileUser = user ?? currentUser;
    if (!profileUser) return false;

    try {
      const profile = await fetchAuthenticatedProfile(profileUser.id);
      if (!profile) {
        console.error('No profile is associated with the authenticated user.');
        setCurrentProfile(null);
        return false;
      }

      applyAuthenticatedProfile(profile);
      return true;
    } catch (error) {
      console.error('Could not load the authenticated user profile:', error);
      setCurrentProfile(null);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadGuestDiscoveryData = async () => {
      const result = await fetchProfileData();
      if (isMounted) setCoachesList(result.coaches);
    };

    void loadGuestDiscoveryData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    const client = supabase;
    let isMounted = true;

    const restoreSession = async () => {
      const { data, error } = await client.auth.getSession();
      if (!isMounted) return;
      if (error) console.error('Could not restore session:', error.message);

      const user = data.session?.user ?? null;
      setCurrentUser(user);
      setIsAuthenticated(Boolean(user));
      if (user) await refreshAuthenticatedProfile(user);
      if (isMounted) setIsAuthLoading(false);
    };

    void restoreSession();

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        clearAuthenticatedProfile();
        setIsAuthLoading(false);
        return;
      }

      setCurrentUser(session.user);
      setIsAuthenticated(true);
      void refreshAuthenticatedProfile(session.user).finally(() => {
        if (isMounted) setIsAuthLoading(false);
      });
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const toggleSaveCoach = (coachId: string) => {
    setSavedCoachIds((ids) => ids.includes(coachId) ? ids.filter((id) => id !== coachId) : [...ids, coachId]);
  };
  const viewCoachDetails = (coach: Coach) => {
    setSelectedCoach(coach);
    setActiveTab('coach-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!supabase) return false;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      console.error('Login failed:', error?.message ?? 'User was not returned.');
      return false;
    }

    setCurrentUser(data.user);
    setIsAuthenticated(true);
    const profileLoaded = await refreshAuthenticatedProfile(data.user);
    if (profileLoaded) setIsLoginOpen(false);
    return profileLoaded;
  };

  const logout = async (): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout failed:', error.message);
  };

  return (
    <AppContext.Provider value={{
      activeTab, setActiveTab, userRole, setUserRole, selectedCoach, setSelectedCoach,
      selectedAthlete, setSelectedAthlete, currentProfile, isAuthLoading, refreshAuthenticatedProfile,
      isOnboardingOpen, setIsOnboardingOpen, isCopilotOpen, setIsCopilotOpen,
      isChatOpen, setIsChatOpen, totalUnreadChatCount, setTotalUnreadChatCount,
      filters, setFilters, resetFilters, savedCoachIds, toggleSaveCoach, viewCoachDetails,
      coachesList, setCoachesList, isAuthenticated, setIsAuthenticated, isLoginOpen, setIsLoginOpen,
      currentUser, login, logout, notifications, addNotification, clearNotifications, unreadCount,
      isCreateListingOpen, setIsCreateListingOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
