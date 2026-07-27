import type { Athlete, Coach, UserRole } from '../types';
import { MOCK_ATHLETES, MOCK_COACHES } from '../data/mockData';
import { supabase } from '../lib/supabase';

type ProfileRow = Record<string, unknown>;

export type AuthenticatedProfile =
  | { role: 'coach'; profile: Coach }
  | { role: 'athlete' | 'club'; profile: Athlete };

const objectValue = (value: unknown): ProfileRow =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as ProfileRow) : {};

const stringValue = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() ? value : fallback;

const arrayValue = <T>(value: unknown, fallback: T[]): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;

const mergedProfile = (row: ProfileRow): ProfileRow => ({
  ...objectValue(row.data),
  ...row,
});

const avatarFor = (id: string, name: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || id)}`;

const normalizeAuthenticatedAthlete = (row: ProfileRow): Athlete => {
  const item = mergedProfile(row);
  const id = stringValue(item.id, 'unknown-athlete');
  const name = stringValue(item.name, 'Athlete');
  const skillLevel = stringValue(item.skill_level ?? item.skillLevel, 'Beginner');
  const validSkillLevels: Athlete['skillLevel'][] = ['Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Elite'];

  return {
    id,
    name,
    age: typeof item.age === 'number' ? item.age : 0,
    avatar: stringValue(item.avatar, avatarFor(id, name)),
    sport: stringValue(item.sport, 'Not specified'),
    specialization: stringValue(item.specialization, 'Not specified'),
    skillLevel: validSkillLevels.includes(skillLevel as Athlete['skillLevel'])
      ? (skillLevel as Athlete['skillLevel'])
      : 'Beginner',
    location: stringValue(item.location, 'Not specified'),
    budgetRange: stringValue(item.budget_range ?? item.budgetRange, 'Not specified'),
    contactNumber: stringValue(item.contact_number ?? item.contactNumber, 'Not provided'),
    email: stringValue(item.email, 'Not provided'),
    bio: stringValue(item.bio, 'No biography provided yet.'),
    goals: arrayValue<string>(item.goals, []),
    achievements: arrayValue<string>(item.achievements, []),
    skillProficiency: arrayValue<{ name: string; score: number }>(item.skill_proficiency ?? item.skillProficiency, []),
  };
};

const normalizeAuthenticatedCoach = (row: ProfileRow): Coach => {
  const item = mergedProfile(row);
  const id = stringValue(item.id, 'unknown-coach');
  const name = stringValue(item.name, 'Coach');
  const coachingStyle = stringValue(item.coaching_style ?? item.coachingStyle, 'Data-Driven');
  const availability = stringValue(item.availability, 'Limited Spots');
  const validStyles: Coach['coachingStyle'][] = [
    'Data-Driven',
    'High Intensity',
    'Holistic & Tactical',
    'Mindset & Elite Performance',
    'Technical Precision',
  ];
  const validAvailability: Coach['availability'][] = ['Immediate', 'Limited Spots', 'Waitlist'];

  return {
    id,
    name,
    title: stringValue(item.title, `${stringValue(item.sport, 'Sports')} Coach`),
    age: typeof item.age === 'number' ? item.age : 0,
    avatar: stringValue(item.avatar, avatarFor(id, name)),
    coverImage: typeof item.cover_image === 'string' ? item.cover_image : undefined,
    sport: stringValue(item.sport, 'Not specified'),
    secondarySports: arrayValue<string>(item.secondary_sports ?? item.secondarySports, []),
    location: stringValue(item.location, 'Not specified'),
    isVerified: item.is_verified === true || item.isVerified === true,
    verificationBadge: stringValue(item.verification_badge ?? item.verificationBadge, 'Unverified'),
    rating: typeof item.rating === 'number' ? item.rating : 0,
    reviewCount: typeof item.review_count === 'number' ? item.review_count : 0,
    yearsExperience: typeof item.years_experience === 'number' ? item.years_experience : 0,
    athletesTrained: typeof item.athletes_trained === 'number' ? item.athletes_trained : 0,
    coachingStyle: validStyles.includes(coachingStyle as Coach['coachingStyle'])
      ? (coachingStyle as Coach['coachingStyle'])
      : 'Data-Driven',
    hourlyRate: typeof item.hourly_rate === 'number' ? item.hourly_rate : 0,
    bio: stringValue(item.bio, 'No biography provided yet.'),
    achievements: arrayValue<string>(item.achievements, []),
    certifications: arrayValue<Coach['certifications'][number]>(item.certifications, []),
    pricingTiers: arrayValue<Coach['pricingTiers'][number]>(item.pricing_tiers ?? item.pricingTiers, []),
    contactNumber: stringValue(item.contact_number ?? item.contactNumber, 'Not provided'),
    email: stringValue(item.email, 'Not provided'),
    availability: validAvailability.includes(availability as Coach['availability'])
      ? (availability as Coach['availability'])
      : 'Limited Spots',
  };
};

export const fetchAuthenticatedProfile = async (authUserId: string): Promise<AuthenticatedProfile | null> => {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as ProfileRow;
  const role = row.role as UserRole;
  if (role === 'coach') return { role, profile: normalizeAuthenticatedCoach(row) };
  if (role === 'athlete' || role === 'club') return { role, profile: normalizeAuthenticatedAthlete(row) };

  throw new Error('The profile has an unsupported role.');
};

// Discovery is public. These fallbacks are intentionally used only while browsing as a guest.
export const fetchProfileData = async (): Promise<{ coaches: Coach[]; athletes: Athlete[] }> => {
  if (!supabase) return { coaches: MOCK_COACHES, athletes: MOCK_ATHLETES };

  try {
    const [coachResult, athleteResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'coach'),
      supabase.from('profiles').select('*').eq('role', 'athlete'),
    ]);

    if (coachResult.error || athleteResult.error) {
      return { coaches: MOCK_COACHES, athletes: MOCK_ATHLETES };
    }

    const coaches = coachResult.data?.length
      ? coachResult.data.map((row) => normalizeAuthenticatedCoach(row as ProfileRow))
      : MOCK_COACHES;
    const athletes = athleteResult.data?.length
      ? athleteResult.data.map((row) => normalizeAuthenticatedAthlete(row as ProfileRow))
      : MOCK_ATHLETES;

    return { coaches, athletes };
  } catch {
    return { coaches: MOCK_COACHES, athletes: MOCK_ATHLETES };
  }
};
