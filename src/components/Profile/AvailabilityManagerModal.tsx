import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, MapPin, Laptop, Plus, Trash2, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Coach, ConsultationSlot, ConsultationFormat } from '../../types';
import {
  fetchAllCoachSlots,
  createCoachSlot,
  updateCoachSlot,
  deleteCoachSlot,
} from '../../services/bookingService';
import { formatTimeRangeInUserTimezone, getUserTimezoneOffset } from '../../lib/dateUtils';
import { useApp } from '../../context/AppContext';

interface AvailabilityManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  coach: Coach;
  onSlotsUpdated?: () => void;
}

export const AvailabilityManagerModal: React.FC<AvailabilityManagerModalProps> = ({
  isOpen,
  onClose,
  coach,
  onSlotsUpdated,
}) => {
  const { addNotification } = useApp();
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mode: 'list' | 'add' | 'edit'
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Form State
  const [slotDate, setSlotDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:45');
  const [format, setFormat] = useState<ConsultationFormat>('online');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadSlots = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllCoachSlots(coach.id, coach.location);
      setSlots(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void loadSlots();
      setMode('list');
      setError(null);
    }
  }, [isOpen, coach.id]);

  const resetForm = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSlotDate(tomorrow.toISOString().split('T')[0]);
    setStartTime('10:00');
    setEndTime('10:45');
    setFormat('online');
    setLocation('');
    setEditingSlotId(null);
    setError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setMode('add');
  };

  const handleOpenEdit = (slot: ConsultationSlot) => {
    setEditingSlotId(slot.id);
    const start = new Date(slot.startsAt);
    const end = new Date(slot.endsAt);
    setSlotDate(start.toISOString().split('T')[0]);
    setStartTime(start.toTimeString().substring(0, 5));
    setEndTime(end.toTimeString().substring(0, 5));
    setFormat(slot.format);
    setLocation(slot.location || '');
    setMode('edit');
    setError(null);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!slotDate || !startTime || !endTime) {
      setError('Please select date, start time, and end time.');
      return;
    }

    const startsAtIso = new Date(`${slotDate}T${startTime}:00`).toISOString();
    const endsAtIso = new Date(`${slotDate}T${endTime}:00`).toISOString();

    if (new Date(endsAtIso) <= new Date(startsAtIso)) {
      setError('End time must be after start time.');
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'add') {
        await createCoachSlot({
          coachId: coach.id,
          startsAt: startsAtIso,
          endsAt: endsAtIso,
          format,
          location: location.trim() || (format === 'online' ? 'Video call link provided after booking' : (coach.location || 'Coach physical location')),
        });
        addNotification({
          type: 'success',
          title: 'Availability Added',
          message: `New ${format} session slot created for ${slotDate}.`,
        });
      } else if (mode === 'edit' && editingSlotId) {
        await updateCoachSlot(editingSlotId, coach.id, {
          startsAt: startsAtIso,
          endsAt: endsAtIso,
          format,
          location: location.trim() || (format === 'online' ? 'Video call link provided after booking' : (coach.location || 'Coach physical location')),
        });
        addNotification({
          type: 'success',
          title: 'Slot Updated',
          message: `Time slot updated for ${slotDate}.`,
        });
      }

      await loadSlots();
      onSlotsUpdated?.();
      setMode('list');
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save availability slot.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to delete this available time slot?')) return;
    try {
      await deleteCoachSlot(slotId, coach.id);
      addNotification({
        type: 'info',
        title: 'Slot Removed',
        message: 'Availability slot deleted successfully.',
      });
      await loadSlots();
      onSlotsUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete slot.');
    }
  };

  const toggleSlotActive = async (slot: ConsultationSlot) => {
    try {
      await updateCoachSlot(slot.id, coach.id, { isActive: !slot.isActive });
      await loadSlots();
      onSlotsUpdated?.();
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#11141a] border border-white/10 rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0 max-w-full box-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 min-w-0 max-w-full">
            <div className="min-w-0 max-w-full">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-xs font-mono font-bold uppercase mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Trainer Dashboard ({getUserTimezoneOffset()})</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight break-words">
                Manage Your Availability
              </h2>
              <p className="text-xs text-brand-muted break-words">
                Add, edit, or remove online & offline time slots for athletes to book.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl text-brand-muted hover:text-white hover:bg-white/10 transition shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode: List View */}
          {mode === 'list' && (
            <div className="space-y-4 min-w-0 max-w-full">
              <div className="flex items-center justify-between gap-2 min-w-0 max-w-full">
                <div className="text-xs font-mono uppercase text-brand-muted tracking-wider truncate">
                  Configured Time Slots ({slots.length})
                </div>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-accent text-black font-extrabold text-xs uppercase tracking-wider hover:bg-brand-accentHover transition shadow-glow-accent min-h-[44px] shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Time Slot</span>
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-6 sm:p-8 text-center space-y-3 min-w-0 max-w-full">
                  <Calendar className="w-10 h-10 text-brand-muted mx-auto" />
                  <p className="text-sm text-zinc-300 font-medium break-words">No time slots configured yet.</p>
                  <p className="text-xs text-brand-muted max-w-sm mx-auto break-words">
                    Add your available dates and time slots so athletes can request 1-on-1 sessions.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/10 mt-2 min-h-[44px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Slot</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 min-w-0 max-w-full">
                  {slots.map((slot) => {
                    const { formattedDate, formattedStart, formattedEnd, tzLabel } = formatTimeRangeInUserTimezone(slot.startsAt, slot.endsAt);

                    return (
                      <div
                        key={slot.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 max-w-full box-border ${
                          slot.isActive
                            ? 'bg-brand-card/90 border-white/10'
                            : 'bg-white/[0.02] border-white/5 opacity-60'
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0 max-w-full">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm">{formattedDate}</span>
                            <span className="px-2 py-0.5 rounded-md bg-white/10 text-zinc-300 text-xs font-mono">
                              {formattedStart} - {formattedEnd} ({tzLabel})
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                                slot.format === 'online'
                                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              }`}
                            >
                              {slot.format}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                slot.isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                              }`}
                            >
                              {slot.isActive ? 'Active' : 'Booked / Off'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 text-xs text-brand-muted">
                            {slot.format === 'online' ? <Laptop className="w-3.5 h-3.5 text-sky-400" /> : <MapPin className="w-3.5 h-3.5 text-amber-400" />}
                            <span className="truncate max-w-md">{slot.location || (slot.format === 'online' ? 'Video link provided upon booking' : 'Physical location')}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => void toggleSlotActive(slot)}
                            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 font-semibold transition min-h-[38px]"
                          >
                            {slot.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(slot)}
                            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                            title="Edit Slot"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(slot.id)}
                            className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                            title="Delete Slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mode: Add / Edit Form */}
          {(mode === 'add' || mode === 'edit') && (
            <form onSubmit={handleSaveSlot} className="space-y-4 sm:space-y-5 min-w-0 max-w-full box-border">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 min-w-0 max-w-full">
                <h3 className="text-base font-bold text-white break-words">
                  {mode === 'add' ? 'Add New Time Slot' : 'Edit Time Slot'}
                </h3>
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="text-xs text-brand-muted hover:text-white transition shrink-0 ml-2"
                >
                  Cancel
                </button>
              </div>

              {/* Format selection */}
              <div className="space-y-1.5 min-w-0 max-w-full">
                <label className="text-xs font-mono uppercase text-brand-muted">Session Format</label>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 min-w-0 max-w-full">
                  {(['online', 'offline'] as ConsultationFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`p-3 sm:p-3.5 rounded-2xl border text-left transition flex items-center justify-between min-h-[44px] min-w-0 max-w-full ${
                        format === fmt
                          ? 'bg-brand-accent/10 border-brand-accent text-white'
                          : 'bg-brand-dark/50 border-white/10 text-brand-muted hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {fmt === 'online' ? <Laptop className="w-4 h-4 text-sky-400 shrink-0" /> : <MapPin className="w-4 h-4 text-amber-400 shrink-0" />}
                        <span className="font-bold text-xs capitalize text-white truncate">{fmt}</span>
                      </div>
                      {format === fmt && <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 min-w-0 max-w-full">
                <div className="space-y-1.5 min-w-0 max-w-full">
                  <label className="text-xs font-mono uppercase text-brand-muted">Date</label>
                  <div className="relative min-w-0 max-w-full">
                    <input
                      type="date"
                      value={slotDate}
                      onChange={(e) => setSlotDate(e.target.value)}
                      className="w-full max-w-full min-w-0 box-border px-3 py-3 rounded-xl bg-brand-dark border border-white/10 text-white text-xs focus:outline-none focus:border-brand-accent transition min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0 max-w-full">
                  <label className="text-xs font-mono uppercase text-brand-muted">Start Time</label>
                  <div className="relative min-w-0 max-w-full">
                    <Clock className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full max-w-full min-w-0 box-border pl-9 pr-3 py-3 rounded-xl bg-brand-dark border border-white/10 text-white text-xs focus:outline-none focus:border-brand-accent transition min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0 max-w-full">
                  <label className="text-xs font-mono uppercase text-brand-muted">End Time</label>
                  <div className="relative min-w-0 max-w-full">
                    <Clock className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full max-w-full min-w-0 box-border pl-9 pr-3 py-3 rounded-xl bg-brand-dark border border-white/10 text-white text-xs focus:outline-none focus:border-brand-accent transition min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Location or online details */}
              <div className="space-y-1.5 min-w-0 max-w-full">
                <label className="text-xs font-mono uppercase text-brand-muted">
                  {format === 'online' ? 'Meeting Link or Video Note (Optional)' : 'Physical Location / Address'}
                </label>
                <input
                  type="text"
                  placeholder={format === 'online' ? 'e.g., Secure video room link' : 'e.g., Main Athletic Track, Court 4'}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full max-w-full min-w-0 box-border px-3.5 py-3 rounded-xl bg-brand-dark border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-brand-accent transition min-h-[44px]"
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-xs text-rose-300 min-w-0 max-w-full box-border">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2 min-w-0 max-w-full">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="w-1/3 py-3.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition min-h-[44px] shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-2/3 py-3.5 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-glow-white disabled:opacity-50 min-h-[44px] shrink-0"
                >
                  {isSaving ? 'Saving Slot...' : (mode === 'add' ? 'Save Available Slot' : 'Update Slot')}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
