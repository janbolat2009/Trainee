import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Camera, Loader2, Save, Upload, Trash2 } from 'lucide-react';
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

  const isCoach = currentProfile?.role === 'coach';

  useEffect(() => {
    if (!isOpen || !currentProfile) return;
    const profile = currentProfile.profile as any;
    setForm({
      name: profile.name ?? '',
      email: profile.email ?? '',
      contactNumber: profile.contactNumber ?? profile.contact_number ?? '',
      password: '',
      age: profile.age ?? '',
      gender: profile.gender ?? '',
      country: profile.country ?? '',
      city: profile.city ?? '',
      sport: profile.sport ?? '',
      specialization: profile.specialization ?? '',
      secondarySports: (profile.secondarySports ?? []).join(', '),
      skillLevel: profile.skillLevel ?? 'Beginner',
      yearsExperience: profile.yearsExperience ?? '',
      hourlyRate: profile.hourlyRate ?? '',
      trainingFormat: profile.trainingFormat ?? 'hybrid',
      trainingGoals: (profile.goals ?? []).join(', '),
      coachingStyle: profile.coachingStyle ?? profile.preferredCoachingStyle ?? 'Data-Driven',
      bio: profile.bio ?? '',
      languagesSpoken: (profile.languagesSpoken ?? profile.languages ?? []).join(', '),
      availability: profile.availability ?? 'Immediate',
      timeZone: profile.timeZone ?? '',
      avatar: profile.avatar ?? '',
      achievements: (profile.achievements ?? []).join(', '),
      previousTeams: (profile.previousTeams ?? []).join(', '),
      education: profile.education ?? '',
      areasOfExpertise: (profile.areasOfExpertise ?? []).join(', '),
      twitter: profile.socialLinks?.twitter ?? '',
      instagram: profile.socialLinks?.instagram ?? '',
      linkedin: profile.socialLinks?.linkedin ?? '',
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
      const bucketName = 'avatars';
      const path = `avatars/${currentProfile.profile.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          throw new Error('Photo storage bucket is not configured in Supabase. Please create a public bucket named "avatars" and try again.');
        }
        throw new Error(uploadError.message);
      }
      const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
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

    // Form Validation
    if (!form.name?.trim()) {
      setError('Full name is required.');
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.age && Number(form.age) < 0) {
      setError('Age must be a positive number.');
      return;
    }
    if (form.yearsExperience && Number(form.yearsExperience) < 0) {
      setError('Years of experience must be a non-negative number.');
      return;
    }

    setIsSaving(true);
    try {
      const combinedLocation = [form.city?.trim(), form.country?.trim()].filter(Boolean).join(', ');
      const preferredPayload: Record<string, unknown> = {
        name: form.name?.trim() || null,
        email: form.email?.trim() || null,
        contact_number: form.contactNumber?.trim() || null,
        age: Number(form.age) || null,
        gender: form.gender?.trim() || null,
        country: form.country?.trim() || null,
        city: form.city?.trim() || null,
        sport: form.sport?.trim() || null,
        specialization: form.specialization?.trim() || null,
        secondary_sports: form.secondarySports?.split(',').map((item: string) => item.trim()).filter(Boolean),
        skill_level: form.skillLevel || null,
        years_experience: Number(form.yearsExperience) || null,
        hourly_rate: Number(form.hourlyRate) || null,
        training_format: form.trainingFormat || 'hybrid',
        bio: form.bio?.trim() || null,
        languages_spoken: form.languagesSpoken?.split(',').map((item: string) => item.trim()).filter(Boolean),
        availability: form.availability || null,
        time_zone: form.timeZone?.trim() || null,
        avatar: form.avatar || null,
        location: combinedLocation || null,
        achievements: form.achievements?.split(',').map((item: string) => item.trim()).filter(Boolean),
        previous_teams: form.previousTeams?.split(',').map((item: string) => item.trim()).filter(Boolean),
        education: form.education?.trim() || null,
        areas_of_expertise: form.areasOfExpertise?.split(',').map((item: string) => item.trim()).filter(Boolean),
        social_links: {
          twitter: form.twitter?.trim() || undefined,
          instagram: form.instagram?.trim() || undefined,
          linkedin: form.linkedin?.trim() || undefined,
        },
      };

      if (form.trainingGoals) preferredPayload.goals = form.trainingGoals.split(',').map((item: string) => item.trim()).filter(Boolean);
      if (form.coachingStyle) preferredPayload.coaching_style = form.coachingStyle;

      if (form.password) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: form.password });
        if (passwordError) throw passwordError;
      }
      if (form.email && form.email !== currentProfile.profile.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: form.email });
        if (emailError) throw emailError;
      }

      const { error: profileError } = await supabase.from('profiles').update(preferredPayload).eq('id', currentProfile.profile.id).select().single();
      if (profileError && (/column .* does not exist/i.test(profileError.message) || /Could not find the/i.test(profileError.message) || /schema cache/i.test(profileError.message))) {
        const fallbackPayload: Record<string, unknown> = {
          name: preferredPayload.name,
          email: preferredPayload.email,
          contact_number: preferredPayload.contact_number,
          country: preferredPayload.country,
          city: preferredPayload.city,
          sport: preferredPayload.sport,
          specialization: preferredPayload.specialization,
          skill_level: preferredPayload.skill_level,
          years_experience: preferredPayload.years_experience,
          bio: preferredPayload.bio,
          avatar: preferredPayload.avatar,
          location: preferredPayload.location,
        };
        const { error: fallbackError } = await supabase.from('profiles').update(fallbackPayload).eq('id', currentProfile.profile.id).select().single();
        if (fallbackError) throw new Error(fallbackError.message);
      } else if (profileError) {
        throw new Error(profileError.message);
      }

      await refreshAuthenticatedProfile(currentUser ?? undefined);
      setSuccess('Profile updated successfully.');
      addNotification({ type: 'success', title: 'Profile updated', message: 'Your account details have been saved.' });
      setTimeout(() => { onClose(); }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/80 p-3 py-4 sm:p-6 sm:py-6">
        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-[28px] border border-brand-border bg-brand-card shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-brand-border/60 p-4 sm:p-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-brand-muted">Edit Profile</p>
              <h2 className="text-xl font-semibold text-white">Manage your account details</h2>
            </div>
            <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-brand-muted transition hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="space-y-5 py-4">
              {/* Photo Upload */}
              <div className="flex flex-col gap-4 rounded-3xl border border-brand-border bg-brand-dark/70 p-4 sm:flex-row sm:items-center">
                <div className="h-20 w-20 overflow-hidden rounded-2xl border border-brand-border bg-brand-elevated">
                  {previewUrl ? <img src={previewUrl} alt="Profile preview" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-brand-muted"><Camera className="h-8 w-8" /></div>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Profile Photo</p>
                  <p className="mt-1 text-xs text-brand-muted">PNG, JPG, JPEG, WEBP up to 5 MB.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-border bg-white/5 px-3 py-2 text-[11px] font-semibold text-white">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{isUploading ? 'Uploading…' : 'Upload Photo'}</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileSelect} />
                    </label>
                    <button type="button" onClick={handleRemovePhoto} className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white/5 px-3 py-2 text-[11px] font-semibold text-white">
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>

              {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</div>}
              {success && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-200">{success}</div>}

              {/* Personal Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase text-brand-accent tracking-wider">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Full Name *</span>
                    <input value={form.name ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Email *</span>
                    <input type="email" value={form.email ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, email: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Phone Number</span>
                    <input value={form.contactNumber ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, contactNumber: e.target.value }))} placeholder="+1 234 567 890" className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Age</span>
                    <input type="number" value={form.age ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, age: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Country</span>
                    <input value={form.country ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, country: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">City</span>
                    <input value={form.city ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, city: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-mono uppercase text-brand-accent tracking-wider">Professional Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Primary Sport</span>
                    <input value={form.sport ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, sport: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Specialization</span>
                    <input value={form.specialization ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, specialization: e.target.value }))} placeholder="e.g. Sprints & Acceleration" className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Coaching Experience (Years)</span>
                    <input type="number" value={form.yearsExperience ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, yearsExperience: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  {isCoach && (
                    <label className="text-sm text-zinc-300">
                      <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Hourly Rate ($)</span>
                      <input type="number" value={form.hourlyRate ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, hourlyRate: e.target.value }))} placeholder="120" className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                    </label>
                  )}
                  {isCoach && (
                    <label className="text-sm text-zinc-300">
                      <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Training Format</span>
                      <select value={form.trainingFormat ?? 'hybrid'} onChange={(e) => setForm((prev: any) => ({ ...prev, trainingFormat: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent">
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </label>
                  )}
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Coaching Philosophy / Style</span>
                    <input value={form.coachingStyle ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, coachingStyle: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Languages Spoken</span>
                    <input value={form.languagesSpoken ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, languagesSpoken: e.target.value }))} placeholder="English, Spanish" className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Availability Status</span>
                    <select value={form.availability ?? 'Immediate'} onChange={(e) => setForm((prev: any) => ({ ...prev, availability: e.target.value }))} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent">
                      <option value="Immediate">Immediate</option>
                      <option value="Limited Spots">Limited Spots</option>
                      <option value="Waitlist">Waitlist</option>
                    </select>
                  </label>
                  <label className="text-sm text-zinc-300 md:col-span-2">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Biography</span>
                    <textarea value={form.bio ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, bio: e.target.value }))} rows={4} className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-mono uppercase text-brand-accent tracking-wider">Additional Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-zinc-300 md:col-span-2">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Achievements (comma separated)</span>
                    <input value={form.achievements ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, achievements: e.target.value }))} placeholder="Olympic Qualifier Coach, 15 National Medalists" className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Previous Teams / Clubs</span>
                    <input value={form.previousTeams ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, previousTeams: e.target.value }))} placeholder="National Track Club, Apex Athletics" className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Education</span>
                    <input value={form.education ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, education: e.target.value }))} placeholder="B.Sc. Kinesiology & Sports Science" className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300 md:col-span-2">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Areas of Expertise (comma separated)</span>
                    <input value={form.areasOfExpertise ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, areasOfExpertise: e.target.value }))} placeholder="Biomechanics, Sprint Mechanics, Recovery Protocols" className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Twitter Handle / URL</span>
                    <input value={form.twitter ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, twitter: e.target.value }))} placeholder="@coach_handle" className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-brand-muted">Instagram Handle / URL</span>
                    <input value={form.instagram ?? ''} onChange={(e) => setForm((prev: any) => ({ ...prev, instagram: e.target.value }))} placeholder="@coach_handle" className="w-full rounded-2xl border border-brand-border bg-brand-dark px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" />
                  </label>
                </div>
              </div>

            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-brand-border/60 px-4 py-4 sm:flex-row sm:justify-end sm:px-5 sm:pt-5">
            <button onClick={onClose} className="rounded-2xl border border-brand-border bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition">Cancel</button>
            <button onClick={handleSave} disabled={isSaving || isUploading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
