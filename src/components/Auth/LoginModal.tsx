import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Lock, Mail, AlertCircle, Sparkles, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LoginModal: React.FC = () => {
  const {
    isLoginOpen,
    setIsLoginOpen,
    setIsOnboardingOpen,
    login,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoginOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        setIsLoginOpen(false);
      } else {
        setError(res.error || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during log in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRegister = () => {
    setIsLoginOpen(false);
    setIsOnboardingOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-[#11141a]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden space-y-6"
        >
          {/* Subtle background ambient light orb */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => setIsLoginOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="space-y-2.5 pt-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Welcome Back</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              Sign In to Trainee
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted">
              Access your customized coaching dashboard, sessions, and AI match analytics.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-brand-muted">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-dark border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-brand-accent transition min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-brand-muted">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-brand-dark border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-brand-accent transition min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-glow-white disabled:opacity-50 min-h-[44px] flex items-center justify-center space-x-2 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </form>

          {/* Footer Register link */}
          <div className="pt-4 border-t border-white/10 text-center space-y-2">
            <p className="text-xs text-brand-muted">
              Don't have an account yet?{' '}
              <button
                onClick={handleOpenRegister}
                className="text-white font-bold hover:text-brand-accent transition underline underline-offset-2 ml-1"
              >
                Create an account
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};