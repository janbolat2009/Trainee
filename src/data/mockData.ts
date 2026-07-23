import { Coach, Athlete, Review, QuizQuestion } from '../types';

export const MOCK_COACHES: Coach[] = [
  {
    id: 'coach-1',
    name: 'Marcus Vance',
    title: 'High-Performance Track & Speed Specialist',
    age: 36,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop',
    sport: 'Track & Field',
    secondarySports: ['Football', 'Sprinting', 'Strength & Conditioning'],
    location: 'London, UK (Hybrid / On-site)',
    isVerified: true,
    verificationBadge: 'UEFA / IAAF MASTER COACH',
    rating: 4.96,
    reviewCount: 48,
    yearsExperience: 12,
    athletesTrained: 140,
    coachingStyle: 'Data-Driven',
    hourlyRate: 95,
    bio: 'Former national 200m sprinter turned elite performance coach. Specializing in biomechanical sprint mechanics, acceleration kinetics, and injury prevention protocol.',
    achievements: [
      'Coached 3 Olympic Trial Qualifiers (2024)',
      'Head of Speed & Agility - Academy League',
      'Author of Kinetic Sprint Conditioning System'
    ],
    certifications: [
      { title: 'IAAF Level 3 Sprint & Jump Specialist', issuer: 'World Athletics', year: 2018, verified: true },
      { title: 'EXOS Performance Specialist (XPS)', issuer: 'EXOS Human Performance', year: 2020, verified: true },
      { title: 'NSCA CSCS Certified', issuer: 'NSCA', year: 2016, verified: true }
    ],
    pricingTiers: [
      {
        name: 'Starter Sprint',
        price: 95,
        period: 'per session',
        description: 'Single 60-min biomechanical analysis & sprint drill baseline.',
        features: ['1-on-1 Field Session', 'High-speed video breakdown', 'Custom weekly drill PDF']
      },
      {
        name: 'Elite Acceleration',
        price: 340,
        period: 'per month',
        description: 'Comprehensive monthly speed development program.',
        features: ['4x 75-min On-field Sessions', 'Full Force-Velocity profiling', 'Direct WhatsApp Access', 'Monthly biomechanics audit'],
        recommended: true
      },
      {
        name: 'Pro Athlete Retainer',
        price: 750,
        period: 'per month',
        description: 'Full-spectrum season preparation & match readiness.',
        features: ['Unlimited video review', 'Weekly on-field sessions', 'Nutrition & recovery synergy', 'Competition day warm-up support']
      }
    ],
    contactNumber: '+44 7700 900123',
    email: 'm.vance@performance.io',
    availability: 'Limited Spots'
  },
  {
    id: 'coach-2',
    name: 'Elena Rostova',
    title: 'Elite Tennis Technique & Mindset Strategist',
    age: 32,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop',
    sport: 'Tennis',
    secondarySports: ['Fitness', 'Mental Conditioning'],
    location: 'Barcelona, Spain / Remote Video Analysis',
    isVerified: true,
    verificationBadge: 'GPTCA / ITF PRO LEVEL',
    rating: 4.98,
    reviewCount: 62,
    yearsExperience: 10,
    athletesTrained: 95,
    coachingStyle: 'Mindset & Elite Performance',
    hourlyRate: 110,
    bio: 'Ex-WTA Top 150 player. Focused on mechanical stroke efficiency, court movement geometry, and pressure-point mental toughness.',
    achievements: [
      'WTA Singles Carrier Rank #134',
      'Coached 4 Junior ITF Grand Slam Competitors',
      'Developed Mental Fortress Match Protocol'
    ],
    certifications: [
      { title: 'ITF Level 3 High Performance Coach', issuer: 'International Tennis Federation', year: 2019, verified: true },
      { title: 'GPTCA International Coach Class A', issuer: 'GPTCA', year: 2021, verified: true }
    ],
    pricingTiers: [
      {
        name: 'Stroke Clinic',
        price: 110,
        period: 'per session',
        description: 'Targeted serve & forehand kinetic chain refinement.',
        features: ['60-min Court Session', 'TrackMan ball data analysis', 'Tactical playbook']
      },
      {
        name: 'Tournament Prep',
        price: 420,
        period: 'per month',
        description: 'Structured competition prep & match analysis.',
        features: ['4x Court Sessions', 'Match Video Breakdown', 'Mental Routine Playbook', '24/7 Matchday Support'],
        recommended: true
      }
    ],
    contactNumber: '+34 612 345 678',
    email: 'elena.rostova@tennispro.es',
    availability: 'Immediate'
  },
  {
    id: 'coach-3',
    name: 'Darius Thorne',
    title: 'Tactical Football & Positional Masterclass',
    age: 41,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    sport: 'Football (Soccer)',
    secondarySports: ['Futsal', 'Tactical Intelligence'],
    location: 'Manchester, UK (On-site & Remote)',
    isVerified: true,
    verificationBadge: 'UEFA A LICENSE',
    rating: 4.92,
    reviewCount: 39,
    yearsExperience: 15,
    athletesTrained: 210,
    coachingStyle: 'Holistic & Tactical',
    hourlyRate: 85,
    bio: 'Former Premier League Academy Development Director. Specialized in positional IQ, pressing mechanics, and technical ball control under pressure.',
    achievements: [
      'Former Manchester City Academy Coach',
      'Developed 12 Current Professional Players',
      'UEFA A License Certified'
    ],
    certifications: [
      { title: 'UEFA A Coaching Diploma', issuer: 'The FA / UEFA', year: 2015, verified: true },
      { title: 'PFSA Football Scouting Level 3', issuer: 'PFSA', year: 2019, verified: true }
    ],
    pricingTiers: [
      {
        name: 'Technical Mastery',
        price: 85,
        period: 'per session',
        description: 'First-touch & rapid decision making drills.',
        features: ['60-min High Intensity Drill', 'Positional Assessment', 'Personalized Drills App access']
      },
      {
        name: 'Academy Pro Path',
        price: 310,
        period: 'per month',
        description: 'Comprehensive positional IQ development.',
        features: ['4x Individual Sessions', 'Game Tape Breakdown', 'Club Scout Introduction Guidance'],
        recommended: true
      }
    ],
    contactNumber: '+44 7890 123456',
    email: 'darius@tacticalfootball.com',
    availability: 'Immediate'
  },
  {
    id: 'coach-4',
    name: 'Kai Tanaka',
    title: 'Combat Sports & Conditioning Specialist',
    age: 34,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop',
    sport: 'Combat Sports',
    secondarySports: ['Boxing', 'MMA', 'Strength & Conditioning'],
    location: 'Tokyo, Japan / Remote Camps',
    isVerified: true,
    verificationBadge: 'PRO COMBAT CERTIFIED',
    rating: 4.99,
    reviewCount: 55,
    yearsExperience: 11,
    athletesTrained: 88,
    coachingStyle: 'High Intensity',
    hourlyRate: 100,
    bio: 'Muay Thai black belt & Strength Conditioning Master. Specialized in striking precision, weight-cut optimization, and explosive power output.',
    achievements: [
      'Head Coach for ONE Championship Fighters',
      '2x National Kickboxing Champion',
      'Conditioning Specialist for Top 10 Contenders'
    ],
    certifications: [
      { title: 'JACB Master Coach Certification', issuer: 'Japan Athletics Combat Board', year: 2017, verified: true },
      { title: 'NSCA CSCS', issuer: 'NSCA', year: 2018, verified: true }
    ],
    pricingTiers: [
      {
        name: 'Fight Readiness Audit',
        price: 100,
        period: 'per session',
        description: 'Striking form, footwork efficiency, and endurance assessment.',
        features: ['60-min Intensive Mitt Work', 'Endurance threshold test', 'Custom fight camp blueprint']
      },
      {
        name: 'Fight Camp Master',
        price: 450,
        period: 'per month',
        description: 'Complete 8-week periodized fight conditioning & strategy.',
        features: ['8x On-mat Sessions', 'Weight cut protocols', 'Opponent tape breakdown', 'Fight night corner support'],
        recommended: true
      }
    ],
    contactNumber: '+81 90 1234 5678',
    email: 'kai@tanaka-striking.jp',
    availability: 'Waitlist'
  },
  {
    id: 'coach-5',
    name: 'Sarah Jenkins',
    title: 'Olympic Swimming Mechanics & Hydrodynamics',
    age: 38,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1200&auto=format&fit=crop',
    sport: 'Swimming',
    secondarySports: ['Triathlon', 'Aquatic Rehabilitation'],
    location: 'Sydney, Australia (Poolside & Remote Video)',
    isVerified: true,
    verificationBadge: 'SWIM AUSTRALIA GOLD',
    rating: 4.95,
    reviewCount: 41,
    yearsExperience: 14,
    athletesTrained: 160,
    coachingStyle: 'Technical Precision',
    hourlyRate: 90,
    bio: 'Olympic Swim Team Biomechanist. Expert in underwater stroke stroke timing, flip-turn hydrodynamics, and VO2 max stroke endurance.',
    achievements: [
      'Biomechanist for Australian National Swim Squad',
      'Coached 6 National Championship Gold Medalists',
      'Developer of Hydro-Streamline Stroke Matrix'
    ],
    certifications: [
      { title: 'ASCTA Gold License Swimming Coach', issuer: 'Swim Australia', year: 2016, verified: true }
    ],
    pricingTiers: [
      {
        name: 'Stroke & Hydro Clinic',
        price: 90,
        period: 'per session',
        description: 'Underwater dual-camera stroke assessment.',
        features: ['60-min Poolside Session', 'High-speed camera video analysis', 'Drag reduction report']
      },
      {
        name: 'Podium Swim Retainer',
        price: 360,
        period: 'per month',
        description: 'Complete stroke perfection & racing strategy.',
        features: ['4x Poolside Sessions', 'Weekly stroke video audits', 'Tapering strategy for meets'],
        recommended: true
      }
    ],
    contactNumber: '+61 412 345 678',
    email: 'sarah.j@aquaticperformance.au',
    availability: 'Limited Spots'
  }
];

export const MOCK_ATHLETES: Athlete[] = [
  {
    id: 'athlete-1',
    name: 'Jordan Miller',
    age: 22,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop',
    sport: 'Track & Field',
    specialization: '100m / 200m Sprint',
    skillLevel: 'Advanced',
    location: 'London, UK',
    budgetRange: '$250 - $500 / month',
    contactNumber: '+44 7111 222333',
    email: 'jordan.m@athletics.co.uk',
    bio: 'Aspiring national team sprinter looking to drop 0.25 seconds off my 100m personal best (current PB: 10.42s). Need data-backed acceleration biomechanics.',
    goals: [
      'Break 10.25s barrier in 100m sprint',
      'Optimize block start reaction time & drive phase',
      'Qualify for National Championships 2025'
    ],
    achievements: [
      '2024 Regional 100m Silver Medalist',
      'University Championship Gold 200m',
      'Personal Best: 10.42s (100m)'
    ],
    skillProficiency: [
      { name: 'Acceleration Power', score: 88 },
      { name: 'Top-End Velocity', score: 82 },
      { name: 'Block Start Technique', score: 74 },
      { name: 'Sprint Endurance', score: 79 },
      { name: 'Mental Focus under Pressure', score: 85 }
    ]
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    athleteName: 'Liam O’Connor',
    athleteAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    rating: 5,
    date: '2 weeks ago',
    sport: 'Track & Field',
    comment: 'Marcus completely transformed my acceleration drive phase in just 3 sessions. His high-speed camera breakdown picked up a hip collapse issue no other coach noticed.'
  },
  {
    id: 'rev-2',
    athleteName: 'Sofia Martinez',
    athleteAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    rating: 5,
    date: '1 month ago',
    sport: 'Tennis',
    comment: 'Elena is world-class! Her tactical playbooks and focus on mental composure during break points helped me win my first ITF Junior circuit match.'
  },
  {
    id: 'rev-3',
    athleteName: 'David Chen',
    athleteAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
    rating: 5,
    date: '3 weeks ago',
    sport: 'Football',
    comment: 'Darius knows football positional IQ inside out. His video analysis of my pressing angles gave me the edge I needed for my academy trial.'
  }
];

export const MATCHMAKING_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is your primary athletic goal right now?',
    subtitle: 'This helps our AI target coaches with specific track records.',
    field: 'goal',
    options: [
      { label: 'Technique & Biomechanics', description: 'Fix mechanical flaws & prevent injury', iconName: 'Activity', value: 'technique' },
      { label: 'Elite Competition Prep', description: 'Prepare for trials, tournaments, or races', iconName: 'Trophy', value: 'competition' },
      { label: 'Explosive Speed & Power', description: 'Boost acceleration, vertical, & sprint kinetics', iconName: 'Zap', value: 'speed' },
      { label: 'Tactical & Game IQ', description: 'Master decision-making & positional reading', iconName: 'Brain', value: 'tactical' }
    ]
  },
  {
    id: 2,
    question: 'Which sport are you seeking coaching in?',
    subtitle: 'Select your primary focus sport.',
    field: 'sport',
    options: [
      { label: 'Track & Field / Sprinting', description: '100m, 200m, hurdles, jumps', iconName: 'Timer', value: 'Track & Field' },
      { label: 'Tennis', description: 'Singles, doubles, stroke mechanics', iconName: 'Target', value: 'Tennis' },
      { label: 'Football / Soccer', description: 'Positional IQ, tactical drills', iconName: 'Dribble', value: 'Football (Soccer)' },
      { label: 'Combat Sports', description: 'Boxing, MMA, striking & grappling', iconName: 'Flame', value: 'Combat Sports' },
      { label: 'Swimming & Aquatics', description: 'Hydrodynamics, VO2 max', iconName: 'Waves', value: 'Swimming' }
    ]
  },
  {
    id: 3,
    question: 'What coaching philosophy resonates most with you?',
    subtitle: 'Match with a coach whose style empowers your learning.',
    field: 'coachingStyle',
    options: [
      { label: 'Data-Driven & Scientific', description: 'Biomechanical metrics, high-speed camera audits', iconName: 'BarChart3', value: 'Data-Driven' },
      { label: 'Mindset & Elite Composure', description: 'Mental resilience, pressure-point mastery', iconName: 'BrainCircuit', value: 'Mindset & Elite Performance' },
      { label: 'High Intensity & Tough Love', description: 'Push past limits, fight-camp mentality', iconName: 'Flame', value: 'High Intensity' },
      { label: 'Holistic & Positional IQ', description: 'Game reading, strategic playbooks', iconName: 'Compass', value: 'Holistic & Tactical' }
    ]
  },
  {
    id: 4,
    question: 'What is your target budget for coaching?',
    subtitle: 'We match transparently with no hidden commission fees.',
    field: 'budget',
    options: [
      { label: '$70 - $100 / session', description: 'Essential 1-on-1 coaching', iconName: 'Coins', value: '100' },
      { label: '$100 - $150 / session', description: 'Advanced specialist & video audits', iconName: 'BadgeDollarSign', value: '150' },
      { label: '$300+ / monthly retainer', description: 'Full season prep & 24/7 access', iconName: 'Crown', value: '500' }
    ]
  }
];

export const INITIAL_COPILOT_MESSAGES = [
  {
    id: 'copilot-init',
    sender: 'assistant' as const,
    text: "Welcome to TRAINEE™! I'm your AI Athletic Copilot. How can I assist your athletic journey today?",
    timestamp: 'Just now',
    suggestedPrompts: [
      "Find top-rated Track & Field coaches",
      "How does AI Matchmaking work?",
      "Help me optimize my athlete profile",
      "Show me coaches under $100/hr"
    ]
  }
];
