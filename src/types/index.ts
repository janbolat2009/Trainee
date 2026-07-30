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
  verificationBadge: string;
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
  matchScore?: number;
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

export interface QAItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  authorName?: string;
  authorRole?: string;
  date?: string;
  upvotes: number;
}

export interface DashboardSession {
  id: string;
  title: string;
  date: string;
  time: string;
  coachName: string;
  coachAvatar: string;
  sport: string;
  duration: string;
  status: 'Completed' | 'Upcoming' | 'In Progress';
  improvementMetric: string;
  improvementDelta: string;
  focusArea: string;
}

export interface ImprovementMetric {
  category: string;
  currentValue: string;
  previousValue: string;
  percentageGain: number;
  trend: 'up' | 'steady';
}

export type TrainingFormat = 'online' | 'offline' | 'hybrid';
export type ListingStatus = 'active' | 'paused' | 'archived';
export type ApplicationStatus = 'pending' | 'accepted' | 'declined';
export type ConsultationFormat = 'online' | 'offline';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type ProgressFlag = 'normal' | 'attention' | 'risk';

export interface ConsultationSlot {
  id: string;
  coachId: string;
  startsAt: string;
  endsAt: string;
  format: ConsultationFormat;
  location: string;
  isActive: boolean;
}

export interface ConsultationBooking {
  id: string;
  coachId: string;
  athleteId: string;
  athleteName: string;
  startsAt: string;
  endsAt: string;
  format: ConsultationFormat;
  location: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CoachListing {
  id: string;
  coachId: string;
  sport: string;
  specialization: string;
  athleteLevel: string;
  trainingFormat: TrainingFormat;
  price: number;
  billingPeriod: 'session' | 'month';
  description: string;
  coachingStyle: string;
  achievements: string[];
  location: string | null;
  mediaUrls: string[];
  status: ListingStatus;
  createdAt: string;
}

export interface ListingApplication {
  id: string;
  listingId: string;
  coachId: string;
  athleteId: string;
  athleteName: string;
  athleteAvatar: string | null;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface CoachStudent {
  athleteId: string;
  name: string;
  avatar: string | null;
  sport: string | null;
  joinedAt: string;
}

export interface AthleteProgressLog {
  id: string;
  athleteId: string;
  coachId: string;
  loggedAt: string;
  metricType: string;
  value: number | null;
  notes: string | null;
  wellbeing: number | null;
  fatigue: number | null;
  painLevel: number | null;
  sleepHours: number | null;
  flag: ProgressFlag;
}

// ── Realtime In-App Chat Interfaces ──────────────────────────────────────────

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  listingId: string | null;
  applicationId: string | null;
  participant1: string;
  participant2: string;
  createdAt: string;
  updatedAt: string;
  // Joined/populated metadata
  otherUser?: {
    id: string;
    name: string;
    avatar: string | null;
    role: UserRole;
  };
  lastMessage?: DirectMessage;
  unreadCount?: number;
}

// ── AI Matchmaking Types ──────────────────────────────────────────────────────

export interface AIDimensionScores {
  sport: number;
  skill: number;
  goal: number;
  style: number;
  budget: number;
  schedule: number;
  experience: number;
  communication: number;
  growth: number;
  overall: number;
}

export interface AICoachRecommendation {
  coachId: string;
  matchScore: number;
  confidenceScore: number;
  compatibilitySummary: string;
  dimensionScores: AIDimensionScores;
  whyFits: string[];
  disadvantages: string[];
  trainingExpectations: string;
  successPotential: string;
}

export interface AIMatchmakingResponse {
  success: boolean;
  recommendations: AICoachRecommendation[];
  meta: {
    processingTimeMs: number;
    model: string;
    coachesAnalyzed: number;
    rateLimitRemaining: number;
  };
  error?: string;
}

/** Coach type extended with AI-generated match data */
export interface AIMatchedCoach extends Coach {
  matchScore: number;
  confidenceScore: number;
  compatibilitySummary: string;
  dimensionScores: AIDimensionScores;
  matchReasons: string[];        // maps to whyFits
  disadvantages: string[];
  trainingExpectations: string;
  successPotential: string;
}

// ── AI Copilot Types ──────────────────────────────────────────────────────────

export interface CopilotConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AICopilotResponse {
  success: boolean;
  message: string;
  suggestedPrompts: string[];
  actionLink?: {
    label: string;
    tab: string;
  };
  meta: {
    processingTimeMs: number;
    model: string;
    rateLimitRemaining: number;
  };
  error?: string;
}

export type AIServiceError =
  | { type: 'auth'; message: string }
  | { type: 'rate_limit'; message: string; resetAt?: string }
  | { type: 'network'; message: string }
  | { type: 'parse'; message: string }
  | { type: 'server'; message: string };
