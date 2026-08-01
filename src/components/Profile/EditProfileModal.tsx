import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Camera, Loader2, Save, Upload, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentProfile, currentUser, refreshAuthenticatedProfile, addNotification } = useApp();
  const [form, setForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !currentProfile) return;
    const profile = currentProfile.profile as any;
    setForm({
      name: profile.name ?? '',
      email: profile.email ?? '',
      password: '',
      age: profile.age ?? '',
      gender: profile.gender ?? '',
      country: profile.country ?? '',
      city: profile.city ?? '',
      sport: profile.sport ?? '',
      secondarySports: (profile.secondarySports ?? []).join(', '),
      skillLevel: profile.skillLevel ?? 'Beginner',
      yearsExperience: profile.yearsExperience ?? '',
      trainingGoals: (profile.goals ?? []).join(', '),
      coachingStyle: profile.coachingStyle ?? profile.preferredCoachingStyle ?? 'Data-Driven',
      bio: profile.bio ?? '',
      languagesSpoken: (profile.languagesSpoken ?? []).join(', '),
      availability: profile.availability ?? 'Immediate',
      timeZone: profile.timeZone ?? '',
      avatar: profile.avatar ?? '',
    });
    setPreviewUrl(profile.avatar ?? null);
    setError(null);
    setSuccess(null);
  }, [isOpen, currentProfile]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only JPG, JPEG, PNG, and WEBP files are supported.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Please choose an image smaller than 5 MB.');
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      if (!supabase || !currentProfile?.profile.id) throw new Error('Supabase is not configured.');
      const path = `avatars/${currentProfile.profile.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setForm((prev: any) => ({ ...prev, avatar: data.publicUrl }));
      setPreviewUrl(data.publicUrl);
      addNotification({ type: 'success', title: 'Photo updated', message: 'Your profile photo has been uploaded.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!supabase || !currentProfile?.profile.id) return;
    setIsUploading(true);
    try {
      setForm((prev: any) => ({ ...prev, avatar: '' }));
      setPreviewUrl(null);
      addNotification({ type: 'info', title: 'Photo removed', message: 'Profile photo removed from your account.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase || !currentProfile) return;
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name?.trim(),
        email: form.email?.trim(),
        age: Number(form.age) || null,
        gender: form.gender?.trim() || null,
        country: form.country?.trim() || null,
        city: form.city?.trim() || null,
        sport: form.sport?.trim() || null,
        secondary_sports: form.secondarySports?.split(',').map((item: string) => item.trim()).filter(Boolean),
        skill_level: form.skillLevel || null,
        years_experience: Number(form.yearsExperience) || null,
        bio: form.bio?.trim() || null,
        languages_spoken: form.languagesSpoken?.split(',').map((item: string) => item.trim()).filter(Boolean),
        availability: form.availability || null,
        time_zone: form.timeZone?.trim() || null,
        avatar: form.avatar || null,
      };
      if (form.trainingGoals) payload.goals = form.trainingGoals.split(',').map((item: string) => item.trim()).filter(Boolean);
      if (form.coachingStyle) payload.coaching_style = form.coachingStyle;
      if (form.password) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: form.password });
        if (passwordError) throw passwordError;
      }
      if (form.email && form.email !== currentProfile.profile.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: form.email });
        if (emailError) throw emailError;
      }
      const { error: profileError } = await supabase.from('profiles').update(payload).eq('id', currentProfile.profile.id).select().single();
      if (profileError) throw new Error(profileError.message);
      await refreshAuthenticatedProfile(currentUser ?? undefined);
      setSuccess('Profile updated successfully.');
      addNotification({ type: 'success', title: 'Profile updated', message: 'Your account details have been saved.' });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 sm:p-6">
        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-[28px] border border-brand-border bg-brand-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-brand-border/60 p-4 sm:p-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-brand-muted">Edit profile</p>
              <h2 className="text-xl font-semibold text-white">Manage your account details</h2>
            </div>
            <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-brand-muted transition hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-0 max-h-[calc(92vh-120px)] overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="space-y-5 py-4">
            <div className="flex flex-col gap-4 rounded-3xl border border-brand-border bg-brand-dark/70 p-4 sm:flex-row sm:items-center">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-brand-border bg-brand-elevated">
                {previewUrl ? <img src={previewUrl} alt="Profile preview" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-brand-muted"><Camera className="h-8 w-8" /></div>}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Profile photo</p>
                <p className="mt-1 text-xs text-brand-muted">PNG, JPG, JPEG, WEBP up to 5 MB.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-border bg-white/5 px-3 py-2 text-[11px] font-semibold text-white">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isUploading ? 'Uploading…' : 'Upload photo'}</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileSelect} />
                  </label>
                  <button type="button" onClick={handleRemovePhoto} className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white/5 px-3 py-2 text-[11px] font-semibold text-white">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
            {success && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</div>}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Full name</span>
                <input value={form.name ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Email</span>
                <input type="email" value={form.email ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, email: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Password</span>
                <input type="password" placeholder="Leave blank to keep current password" value={form.password ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, password: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Age</span>
                <input type="number" value={form.age ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, age: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Gender</span>
                <input value={form.gender ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, gender: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Country</span>
                <input value={form.country ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, country: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">City</span>
                <input value={form.city ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, city: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Primary sport</span>
                <input value={form.sport ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, sport: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Secondary sports</span>
                <input value={form.secondarySports ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, secondarySports: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Skill level</span>
                <input value={form.skillLevel ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, skillLevel: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Years experience</span>
                <input type="number" value={form.yearsExperience ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, yearsExperience: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Training goals</span>
                <input value={form.trainingGoals ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, trainingGoals: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Preferred coaching style</span>
                <input value={form.coachingStyle ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, coachingStyle: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300 md:col-span-2">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Biography</span>
                <textarea value={form.bio ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, bio: e.target.value }))} rows={4} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Languages</span>
                <input value={form.languagesSpoken ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, languagesSpoken: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Availability</span>
                <input value={form.availability ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, availability: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Time zone</span>
                <input value={form.timeZone ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, timeZone: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-sm text-white" />
              </label>
            </div>
          </div>
        </div>

          <div className="flex flex-col-reverse gap-3 border-t border-brand-border/60 px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
            <button onClick={onClose} className="rounded-2xl border border-brand-border bg-white/5 px-4 py-2.5 text-sm font-semibold text-white">Cancel</button>
            <button onClick={handleSave} disabled={isSaving || isUploading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isSaving ? 'Saving…' : 'Save changes'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
