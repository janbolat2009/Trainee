import React, { createContext, useContext, useState } from 'react';
import { Coach, Athlete, FilterState, UserRole } from '../types';
import { MOCK_COACHES, MOCK_ATHLETES } from '../data/mockData';

export type ActiveTab = 'home' | 'discovery' | 'matchmaking' | 'coach-profile' | 'athlete-profile';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  selectedCoach: Coach;
  setSelectedCoach: (coach: Coach) => void;
  selectedAthlete: Athlete;
  setSelectedAthlete: (athlete: Athlete) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  savedCoachIds: string[];
  toggleSaveCoach: (coachId: string) => void;
  viewCoachDetails: (coach: Coach) => void;
  coachesList: Coach[];
  setCoachesList: React.Dispatch<React.SetStateAction<Coach[]>>;
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  sport: 'All',
  location: '',
  maxPrice: 200,
  minRating: 0,
  skillLevel: 'All',
  coachingStyle: 'All',
  verifiedOnly: false,
  availability: 'All',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [userRole, setUserRole] = useState<UserRole>('athlete');
  const [selectedCoach, setSelectedCoach] = useState<Coach>(MOCK_COACHES[0]);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete>(MOCK_ATHLETES[0]);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [savedCoachIds, setSavedCoachIds] = useState<string[]>(['coach-1', 'coach-2']);
  const [coachesList, setCoachesList] = useState<Coach[]>(MOCK_COACHES);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const toggleSaveCoach = (coachId: string) => {
    setSavedCoachIds(prev => 
      prev.includes(coachId) ? prev.filter(id => id !== coachId) : [...prev, coachId]
    );
  };

  const viewCoachDetails = (coach: Coach) => {
    setSelectedCoach(coach);
    setActiveTab('coach-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      userRole,
      setUserRole,
      selectedCoach,
      setSelectedCoach,
      selectedAthlete,
      setSelectedAthlete,
      isOnboardingOpen,
      setIsOnboardingOpen,
      isCopilotOpen,
      setIsCopilotOpen,
      filters,
      setFilters,
      resetFilters,
      savedCoachIds,
      toggleSaveCoach,
      viewCoachDetails,
      coachesList,
      setCoachesList
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
