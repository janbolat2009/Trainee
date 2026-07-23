export type UserRole = 'athlete' | 'coach' | 'club';

export interface Certification {
  title: string;
  issuer: string;
  year: number;
  verified: boolean;
  certificateUrl?: string;
}

export interface Review {
  id: string;
  athleteName: string;
  athleteAvatar: string;
  rating: number;
  date: string;
  sport: string;
  comment: string;
}

export interface PricingTier {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface Coach {
  id: string;
  name: string;
  title: string;
  age: number;
  avatar: string;
  coverImage?: string;
  sport: string;
  secondarySports: string[];
  location: string;
  isVerified: boolean;
  verificationBadge: string; // e.g. "PRO LICENSED MASTER"
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  athletesTrained: number;
  coachingStyle: 'Data-Driven' | 'High Intensity' | 'Holistic & Tactical' | 'Mindset & Elite Performance' | 'Technical Precision';
  hourlyRate: number;
  bio: string;
  achievements: string[];
  certifications: Certification[];
  pricingTiers: PricingTier[];
  contactNumber: string;
  email: string;
  availability: 'Immediate' | 'Limited Spots' | 'Waitlist';
  matchScore?: number; // Calculated dynamically in AI Matchmaking
  matchReasons?: string[];
}

export interface Athlete {
  id: string;
  name: string;
  age: number;
  avatar: string;
  sport: string;
  specialization: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Semi-Pro' | 'Elite';
  location: string;
  budgetRange: string;
  contactNumber: string;
  email: string;
  bio: string;
  goals: string[];
  achievements: string[];
  skillProficiency: { name: string; score: number }[];
}

export interface FilterState {
  searchQuery: string;
  sport: string;
  location: string;
  maxPrice: number;
  minRating: number;
  skillLevel: string;
  coachingStyle: string;
  verifiedOnly: boolean;
  availability: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  subtitle: string;
  field: string;
  options: {
    label: string;
    description: string;
    iconName: string;
    value: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
  actionLink?: {
    label: string;
    tab: string;
  };
}
