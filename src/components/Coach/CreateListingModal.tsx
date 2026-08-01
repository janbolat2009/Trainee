import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronDown, CheckCircle2, AlertCircle, Loader2,
  MapPin, DollarSign, Dumbbell, Layers, Users, FileText,
} from 'lucide-react';
import { createListing, updateListing } from '../../services/coachListingService';
import type { CoachListing, TrainingFormat } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingListing?: CoachListing;
  onSaved?: (listing: CoachListing) => void;
}

const SPORTS = ['Track & Field', 'Tennis', 'Football (Soccer)', 'Basketball', 'Swimming', 'Combat Sports', 'Volleyball', 'Gymnastics', 'CrossFit', 'Cycling', 'Triathlon', 'Other'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Elite', 'Any'];

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[11px] font-medium text-brand-muted mb-1.5 block">{children}</label>
);

const inputCls = 'w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-accent transition';
const selectCls = `${inputCls} cursor-pointer`;

export const CreateListingModal: React.FC<Props> = ({ isOpen, onClose, existingListing, onSaved }) => {
  const { currentProfile, addNotification } = useApp();
  const isEditing = Boolean(existingListing);

  const [form, setForm] = useState({
    sport: existingListing?.sport ?? 'Track & Field',
    specialization: existingListing?.specialization ?? '',
    athleteLevel: existingListing?.athleteLevel ?? 'Any',
    trainingFormat: (existingListing?.trainingFormat ?? 'hybrid') as TrainingFormat,
    price: existingListing?.price ?? 0,
    billingPeriod: (existingListing?.billingPeriod ?? 'session') as 'session' | 'month',
    description: existingListing?.description ?? '',
    coachingStyle: existingListing?.coachingStyle ?? '',
    achievements: existingListing?.achievements.join('\n') ?? '',
    location: existingListing?.location ?? '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const coachProfileId = currentProfile?.profile.id ?? '';

  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.description.trim()) { setErrorMsg('Please add a description.'); return; }
    if (form.price < 0) { setErrorMsg('Price cannot be negative.'); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        sport: form.sport,
        specialization: form.specialization,
        athleteLevel: form.athleteLevel,
        trainingFormat: form.trainingFormat,
        price: Number(form.price),
        billingPeriod: form.billingPeriod,
        description: form.description,
        coachingStyle: form.coachingStyle,
        achievements: form.achievements.split('\n').map((s) => s.trim()).filter(Boolean),
        location: form.trainingFormat !== 'online' ? form.location : null,
        mediaUrls: [] as string[],
        status: 'active' as const,
      };

      let result: CoachListing | null = null;
      if (isEditing && existingListing) {
        const ok = await updateListing(existingListing.id, payload);
        if (ok) result = { ...existingListing, ...payload };
      } else {
        result = await createListing(coachProfileId, payload);
      }

      if (!result) {
        setErrorMsg('Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
      addNotification({ type: 'success', title: 'Listing saved!', message: `"${form.sport}" listing is now ${isEditing ? 'updated' : 'live'}.` });
      onSaved?.(result);
      setTimeout(() => { setSuccess(false); onClose(); }, 1200);
    } catch {
      setErrorMsg('Unexpected error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-4 py-4 bg-black/80 backdrop-blur-md sm:py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-brand-card border border-brand-border rounded-3xl shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-border/60">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isEditing ? 'Edit Listing' : 'Create Training Listing'}
            </h2>
            <p className="text-xs text-brand-muted mt-0.5">
              {isEditing ? 'Update your listing details' : 'Describe your coaching offer so athletes can find you'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[70vh]">
          <div className="p-6 space-y-5">

            {/* Sport & Specialization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel><Dumbbell className="w-3.5 h-3.5 inline mr-1" />Sport / Specialization</FieldLabel>
                <select value={form.sport} onChange={(e) => setField('sport', e.target.value)} className={selectCls}>
                  {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Focus / Specialization (optional)</FieldLabel>
                <input
                  type="text"
                  placeholder="e.g. Sprint acceleration, Serve technique"
                  value={form.specialization}
                  onChange={(e) => setField('specialization', e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Athlete Level */}
            <div>
              <FieldLabel><Users className="w-3.5 h-3.5 inline mr-1" />Athlete Level</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setField('athleteLevel', lvl)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                      form.athleteLevel === lvl
                        ? 'bg-brand-accent/20 border-brand-accent text-brand-accent'
                        : 'bg-brand-dark border-brand-border text-brand-muted hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Training Format */}
            <div>
              <FieldLabel><Layers className="w-3.5 h-3.5 inline mr-1" />Training Format</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {(['online', 'offline', 'hybrid'] as TrainingFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setField('trainingFormat', fmt)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold capitalize transition ${
                      form.trainingFormat === fmt
                        ? 'bg-brand-elevated border-brand-accent text-white'
                        : 'bg-brand-dark border-brand-border text-brand-muted hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Location (offline/hybrid) */}
            {form.trainingFormat !== 'online' && (
              <div>
                <FieldLabel><MapPin className="w-3.5 h-3.5 inline mr-1" />Location</FieldLabel>
                <input
                  type="text"
                  placeholder="e.g. Almaty, Kazakhstan"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  className={inputCls}
                />
              </div>
            )}

            {/* Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel><DollarSign className="w-3.5 h-3.5 inline mr-1" />Price</FieldLabel>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setField('price', Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel>Billing Period</FieldLabel>
                <div className="flex gap-2">
                  {(['session', 'month'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setField('billingPeriod', p)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold capitalize transition ${
                        form.billingPeriod === p
                          ? 'bg-brand-elevated border-brand-accent text-white'
                          : 'bg-brand-dark border-brand-border text-brand-muted hover:text-white'
                      }`}
                    >
                      Per {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <FieldLabel><FileText className="w-3.5 h-3.5 inline mr-1" />Description & Coaching Style</FieldLabel>
              <textarea
                rows={4}
                placeholder="Describe your coaching methodology, what athletes can expect, and your approach to training..."
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Achievements */}
            <div>
              <FieldLabel>Achievements / Track Record (one per line)</FieldLabel>
              <textarea
                rows={3}
                placeholder="e.g. Trained 3 national champions&#10;15+ years coaching experience&#10;Certified UEFA A coach"
                value={form.achievements}
                onChange={(e) => setField('achievements', e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-brand-border/60 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-brand-border text-xs font-medium text-brand-muted hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition disabled:opacity-60 shadow-glow-white"
            >
              {success ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>Saved!</span></>
              ) : isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Publish Listing'}</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
