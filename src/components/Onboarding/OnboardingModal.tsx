import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { supabase } from '../../lib/supabase'; // поправь путь под свою структуру
import { X, Check, ArrowRight, ArrowLeft, Trophy, ShieldCheck, Building2, Sparkles, Lock, Mail, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    refreshAuthenticatedProfile,
    setIsCreateListingOpen,
  } = useApp();

  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('athlete');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    sport: 'Track & Field',
    skillLevel: 'Advanced',
    location: '',
    bio: ''
  });

  if (!isOnboardingOpen) return null;

  const validateStep2 = () => {
    if (!formData.fullName.trim()) return 'Please enter your full name.';
    if (!formData.email.trim()) return 'Please enter your email.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleNext = async () => {
    setErrorMsg(null);

    // Валидация перед переходом со step 2 (email/password)
    if (step === 2) {
      const validationError = validateStep2();
      if (validationError) {
        setErrorMsg(validationError);
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
      return;
    }

    // === STEP 4 -> Финальная регистрация ===
    if (!supabase) {
      setErrorMsg('Supabase client is not initialized. Check your .env file and restart the dev server.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Регистрация в Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        setErrorMsg(authError.message);
        setIsSubmitting(false);
        return;
      }

      const authUser = authData.user;
      const authUserId = authUser?.id;

      if (!authUserId || !authUser) {
        setErrorMsg('Account created, but no user ID returned. Try again.');
        setIsSubmitting(false);
        return;
      }

      // 2. Запись профиля в таблицу profiles
      const { data: insertedProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          auth_user_id: authUserId,
          role: selectedRole,
          name: formData.fullName,
          email: formData.email,
          sport: formData.sport,
          skill_level: formData.skillLevel,
          location: formData.location,
          bio: formData.bio,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        setErrorMsg(
          `Profile was not saved: ${insertError.message}. ` +
          `If "Confirm email" is enabled in Supabase Auth settings, you need to confirm your email before the profile can be created.`
        );
        setIsSubmitting(false);
        return;
      }

      console.log('Profile created:', insertedProfile);

      // The context reloads the exact profile by auth_user_id and routes by its stored role.
      const profileLoaded = await refreshAuthenticatedProfile(authUser);
      if (!profileLoaded) {
        setErrorMsg('Your account was created, but its profile could not be loaded. Please sign in again.');
        return;
      }

      // Успех
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setIsOnboardingOpen(false);

      // For coaches: prompt to create first listing after a short delay
      if (selectedRole === 'coach') {
        setTimeout(() => { setIsCreateListingOpen(true); }, 800);
      }
    } catch (err) {
      console.error('Unexpected error during registration:', err);
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >

        {/* Close Button */}
        <button
          onClick={() => setIsOnboardingOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-brand-muted mb-2">
            <span>Step {step} of 4</span>
            <span className="text-brand-accent">{Math.round((step / 4) * 100)}% Completed</span>
          </div>
          <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand-accent"
              initial={{ width: '25%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content Switcher */}
        <AnimatePresence mode="wait">

          {/* STEP 1: Select Role */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                  Select Your Account Role
                </h2>
                <p className="text-xs text-brand-muted">
                  How do you plan to utilize TRAINEE™? You can switch modes anytime.
                </p>
              </div>

              <div className="space-y-3">

                {/* Role 1: Athlete */}
                <div
                  onClick={() => setSelectedRole('athlete')}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    selectedRole === 'athlete'
                      ? 'bg-brand-elevated border-brand-accent shadow-glow-accent'
                      : 'bg-brand-dark/50 border-brand-border hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-3 rounded-xl bg-brand-black border border-brand-border">
                      <Trophy className="w-5 h-5 text-brand-accent" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">I'm an Athlete</div>
                      <div className="text-xs text-brand-muted">Seeking 1-on-1 coaching, biomechanics audits & AI matching.</div>
                    </div>
                  </div>
                  {selectedRole === 'athlete' && <Check className="w-5 h-5 text-brand-accent" />}
                </div>

                {/* Role 2: Coach */}
                <div
                  onClick={() => setSelectedRole('coach')}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    selectedRole === 'coach'
                      ? 'bg-brand-elevated border-brand-accent shadow-glow-accent'
                      : 'bg-brand-dark/50 border-brand-border hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-3 rounded-xl bg-brand-black border border-brand-border">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">I'm a Verified Coach</div>
                      <div className="text-xs text-brand-muted">Publish certifications, set pricing tiers & recruit athletes.</div>
                    </div>
                  </div>
                  {selectedRole === 'coach' && <Check className="w-5 h-5 text-brand-accent" />}
                </div>

                {/* Role 3: Club */}
                <div
                  onClick={() => setSelectedRole('club')}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    selectedRole === 'club'
                      ? 'bg-brand-elevated border-brand-accent shadow-glow-accent'
                      : 'bg-brand-dark/50 border-brand-border hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-3 rounded-xl bg-brand-black border border-brand-border">
                      <Building2 className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">Sports Club / Academy</div>
                      <div className="text-xs text-brand-muted">Manage roster talent, hire coaches & streamline operations.</div>
                    </div>
                  </div>
                  {selectedRole === 'club' && <Check className="w-5 h-5 text-brand-accent" />}
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 2: Credentials & Social Login */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                  Create Account Credentials
                </h2>
                <p className="text-xs text-brand-muted">
                  Sign up with email or fast-track with social providers.
                </p>
              </div>

              {/* Social Login Buttons — пока просто визуальные, реальный OAuth не подключён */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled
                  title="Google OAuth not connected yet"
                  className="py-2.5 px-4 rounded-xl bg-brand-elevated border border-brand-border text-xs font-semibold text-white opacity-50 cursor-not-allowed transition flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.3C.6 9.3 0 11.6 0 14s.6 4.7 1.6 6.7l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  disabled
                  title="Apple OAuth not connected yet"
                  className="py-2.5 px-4 rounded-xl bg-brand-elevated border border-brand-border text-xs font-semibold text-white opacity-50 cursor-not-allowed transition flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.87c.68-.82 1.14-1.97.99-3.12-1 .04-2.19.67-2.88 1.47-.62.72-1.17 1.89-.99 3.01 1.11.09 2.22-.54 2.88-1.36z" />
                  </svg>
                  <span>Apple ID</span>
                </button>
              </div>

              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-brand-border" />
                <span className="px-3 text-[10px] uppercase font-mono text-brand-muted">or continue with email</span>
                <div className="flex-1 border-t border-brand-border" />
              </div>

              {/* Form Controls */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-brand-muted mb-1 block">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-brand-muted absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-brand-dark border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-brand-muted mb-1 block">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-brand-muted absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="alex@performance.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-brand-dark border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-brand-muted mb-1 block">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-brand-muted absolute left-3.5 top-3" />
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-brand-dark border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Sport & Skill Level */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                  Sport Specialization & Level
                </h2>
                <p className="text-xs text-brand-muted">
                  Configure your primary sport focus to optimize AI matching.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-brand-muted mb-1.5 block">Primary Sport Focus</label>
                  <select
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent"
                  >
                    <option value="Track & Field">Track & Field / Sprinting</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Football (Soccer)">Football (Soccer)</option>
                    <option value="Combat Sports">Combat Sports (Boxing / MMA)</option>
                    <option value="Swimming">Swimming & Aquatics</option>
                    <option value="Basketball">Basketball</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-brand-muted mb-1.5 block">Skill Level Tier</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Intermediate', 'Advanced', 'Semi-Pro', 'Elite Master'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormData({ ...formData, skillLevel: lvl })}
                        className={`p-3 rounded-xl border text-xs font-semibold text-left transition ${
                          formData.skillLevel === lvl
                            ? 'bg-brand-elevated border-brand-accent text-white'
                            : 'bg-brand-dark border-brand-border text-brand-muted hover:text-white'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-brand-muted mb-1 block">City / Training Base</label>
                  <input
                    type="text"
                    placeholder="e.g. London, UK or Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-accent"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Bio & Review */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                  Finalize Your Profile
                </h2>
                <p className="text-xs text-brand-muted">
                  Add a short bio describing your goals or coaching methodology.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-medium text-brand-muted mb-1 block">Bio & Performance Goals</label>
                <textarea
                  rows={4}
                  placeholder="Describe your athletic journey, target personal records, or coaching philosophy..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-accent"
                />
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-brand-dark border border-brand-border text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Account Role:</span>
                  <span className="font-bold text-white uppercase">{selectedRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Sport:</span>
                  <span className="text-brand-accent">{formData.sport}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Skill Tier:</span>
                  <span className="text-white">{formData.skillLevel}</span>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Ошибка */}
        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Controls (Back & Next) */}
        <div className="mt-8 pt-4 border-t border-brand-border/60 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-white/5 border border-brand-border text-xs font-semibold text-brand-muted hover:text-white transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition flex items-center space-x-2 shadow-glow-white ml-auto disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Saving...' : step === 4 ? 'Complete Registration' : 'Continue'}</span>
            {step === 4 ? <Sparkles className="w-4 h-4 fill-black" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

      </motion.div>
    </div>
  );
};
