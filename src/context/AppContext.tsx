import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import type { Athlete, AthleteInsight, Coach, ConsultationBooking, FilterState, ReminderItem, UserRole } from '../types';
import { MOCK_ATHLETES, MOCK_COACHES } from '../data/mockData';
import { supabase } from '../lib/supabase';
import {
  fetchAuthenticatedProfile,
  fetchProfileData,
  type AuthenticatedProfile,
} from '../services/profileService';
import { loadStoredReminders, saveStoredReminders } from '../services/reminderService';

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
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  reminders: ReminderItem[];
  addReminder: (item: ReminderItem) => void;
  markReminderAsRead: (id: string) => void;
  dismissReminder: (id: string) => void;
  markReminderAsCompleted: (id: string) => void;
  athleteInsights: AthleteInsight[];
  addAthleteInsight: (item: Omit<AthleteInsight, 'id' | 'timestamp'>) => void;
  // Coach onboarding: trigger listing creation after registration
  isCreateListingOpen: boolean;
  setIsCreateListingOpen: (open: boolean) => void;
  activeMeetingBooking: ConsultationBooking | null;
  setActiveMeetingBooking: (booking: ConsultationBooking | null) => void;
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '', sport: 'All', location: '', priceRange: { min: 50, max: 250 }, minRating: 0,
  skillLevel: 'All', coachingStyle: 'All', verifiedOnly: false, availability: 'All', experience: 'Any',
  languages: [], availabilityWindow: 'Any', trainingFormat: 'Any', coachType: 'Any', sortBy: 'highest-rated',
};

const FILTERS_STORAGE_KEY = 'apexlink-discovery-filters';

const readStoredFilters = (): FilterState => {
  if (typeof window === 'undefined') return DEFAULT_FILTERS;
  try {
    const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw) as Partial<FilterState>;
    return {
      ...DEFAULT_FILTERS,
      ...parsed,
      priceRange: parsed.priceRange ?? DEFAULT_FILTERS.priceRange,
      languages: parsed.languages ?? [],
    };
  } catch {
    return DEFAULT_FILTERS;
  }
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
  const [activeMeetingBooking, setActiveMeetingBooking] = useState<ConsultationBooking | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [reminders, setReminders] = useState<ReminderItem[]>(() => loadStoredReminders());
  const [athleteInsights, setAthleteInsights] = useState<AthleteInsight[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length + reminders.filter((item) => item.isUnread).length;

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
  const addReminder = (item: ReminderItem) => {
    setReminders((prev) => [item, ...prev.filter((entry) => entry.bookingId !== item.bookingId || entry.id !== item.id)]);
  };
  const markReminderAsRead = (id: string) => {
    setReminders((prev) => prev.map((item) => item.id === id ? { ...item, isUnread: false } : item));
  };
  const dismissReminder = (id: string) => {
    setReminders((prev) => prev.map((item) => item.id === id ? { ...item, status: 'dismissed' } : item));
  };
  const markReminderAsCompleted = (id: string) => {
    setReminders((prev) => prev.map((item) => item.id === id ? { ...item, status: 'completed', isUnread: false } : item));
  };

  const addAthleteInsight = (item: Omit<AthleteInsight, 'id' | 'timestamp'>) => {
    const insight: AthleteInsight = {
      ...item,
      id: `insight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };

    setAthleteInsights((prev) => [insight, ...prev].slice(0, 12));

    if (typeof window !== 'undefined') {
      const syncKey = 'trainee-athlete-insights';
      window.localStorage.setItem(syncKey, JSON.stringify(insight));
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('trainee-athlete-insights');
        channel.postMessage(insight);
        channel.close();
      }
    }
  };

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
    if (isMounted && result.coaches?.length > 0) {
      setCoachesList(result.coaches);
    }
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

  const isFirstFiltersRender = React.useRef(true);

useEffect(() => {
  if (typeof window === 'undefined') return;

  if (isFirstFiltersRender.current) {
    isFirstFiltersRender.current = false;
    return;
  }

  window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
}, [filters]);

  useEffect(() => {
    saveStoredReminders(reminders);
  }, [reminders]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncKey = 'trainee-athlete-insights';
    const syncIncoming = (event: StorageEvent) => {
      if (event.key !== syncKey || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as AthleteInsight;
        setAthleteInsights((prev) => (prev.some((item) => item.id === parsed.id) ? prev : [parsed, ...prev].slice(0, 12)));
      } catch {
        // ignore malformed payloads
      }
    };

    const channel = 'BroadcastChannel' in window ? new BroadcastChannel('trainee-athlete-insights') : null;
    channel?.addEventListener('message', (event: MessageEvent<AthleteInsight>) => {
      const parsed = event.data;
      if (!parsed?.id) return;
      setAthleteInsights((prev) => (prev.some((item) => item.id === parsed.id) ? prev : [parsed, ...prev].slice(0, 12)));
    });

    window.addEventListener('storage', syncIncoming);

    return () => {
      channel?.close();
      window.removeEventListener('storage', syncIncoming);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setReminders((prev) => prev.map((item) => {
        if (item.status !== 'scheduled') return item;
        if (new Date(item.scheduledFor).getTime() > now) return item;
        return { ...item, status: 'triggered', isUnread: true };
      }));
    }, 30000);

    return () => window.clearInterval(timer);
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
      isCreateListingOpen, setIsCreateListingOpen, activeMeetingBooking, setActiveMeetingBooking,
      isNotificationsOpen, setIsNotificationsOpen, reminders, addReminder, markReminderAsRead, dismissReminder, markReminderAsCompleted,
      athleteInsights, addAthleteInsight,
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
