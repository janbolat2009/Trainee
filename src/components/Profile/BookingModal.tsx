import React, { useEffect, useMemo, useState } from 'react';
import { X, Calendar, Clock3, MapPin, Laptop, CheckCircle2, AlertTriangle, Video } from 'lucide-react';
import type { Athlete, Coach, ConsultationSlot, ConsultationFormat, ConsultationBooking } from '../../types';
import { fetchCoachAvailabilitySlots, bookConsultation } from '../../services/bookingService';
import { formatFullDateTimeInUserTimezone, formatTimeRangeInUserTimezone, getUserTimezoneOffset } from '../../lib/dateUtils';
import { useApp } from '../../context/AppContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  coach: Coach;
  athleteProfile: Athlete | null;
  onBookingCreated?: (booking: ConsultationBooking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  coach,
  athleteProfile,
  onBookingCreated,
}) => {
  const { setIsLoginOpen, addNotification, isAuthenticated, setActiveMeetingBooking, addReminder } = useApp();
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<ConsultationFormat>('online');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ConsultationBooking | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadSlots = async () => {
      setIsLoading(true);
      const data = await fetchCoachAvailabilitySlots(coach.id, coach.location ?? null);
      setSlots(data);
      setSelectedSlotId(data.find((slot) => slot.format === selectedFormat)?.id ?? null);
      setIsLoading(false);
    };

    void loadSlots();
  }, [isOpen, coach.id, coach.location, selectedFormat]);

  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.format === selectedFormat && slot.isActive),
    [slots, selectedFormat],
  );

  const selectedSlot = useMemo(
    () => availableSlots.find((slot) => slot.id === selectedSlotId) ?? availableSlots[0] ?? null,
    [availableSlots, selectedSlotId],
  );

  useEffect(() => {
    if (availableSlots.length > 0 && !selectedSlotId) {
      setSelectedSlotId(availableSlots[0].id);
    }
  }, [availableSlots, selectedSlotId]);

  const handleBook = async () => {
    if (!athleteProfile) {
      setIsLoginOpen(true);
      return;
    }

    if (!selectedSlot) {
      setError('Please select a time slot to continue.');
      return;
    }

    setError(null);
    setIsBooking(true);

    try {
      const booking = await bookConsultation({
        coachId: coach.id,
        athleteId: athleteProfile.id,
        athleteName: athleteProfile.name,
        slotId: selectedSlot.id,
        startsAt: selectedSlot.startsAt,
        endsAt: selectedSlot.endsAt,
        format: selectedSlot.format,
        location: selectedSlot.location,
      });

      setSuccess(booking);
      setActiveMeetingBooking(booking);
      onBookingCreated?.(booking);

      // Real-time update: remove booked slot from local state immediately
      setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id));
      setSelectedSlotId(null);

      const reminderBase = {
        bookingId: booking.id,
        title: `Consultation with ${coach.name}`,
        message: `Your session starts at ${formatFullDateTimeInUserTimezone(booking.startsAt)}.`,
        scheduledFor: booking.startsAt,
        status: 'scheduled' as const,
        isUnread: true,
      };
      addReminder({ ...reminderBase, id: `reminder-${booking.id}-hour`, joinUrl: booking.format === 'online' ? '/meeting' : undefined });
      addReminder({ ...reminderBase, id: `reminder-${booking.id}-five`, scheduledFor: new Date(new Date(booking.startsAt).getTime() - 5 * 60 * 1000).toISOString(), title: `Starting soon: ${coach.name}`, message: 'Join your meeting in 5 minutes.', status: 'scheduled', isUnread: true, joinUrl: booking.format === 'online' ? '/meeting' : undefined });
      addNotification({
        type: 'success',
        title: 'Consultation Requested',
        message: `Your booking request for ${formatFullDateTimeInUserTimezone(booking.startsAt)} has been sent to ${coach.name}.`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create booking.');
    } finally {
      setIsBooking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/70 p-4 py-4 backdrop-blur-sm sm:py-6">
      <div className="w-full max-w-xl sm:max-w-2xl rounded-[32px] bg-[#111318] border border-white/10 shadow-2xl overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-muted">Book Consultation</p>
            <h2 className="mt-2 text-xl font-extrabold text-white">Schedule with {coach.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-brand-muted hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr,0.9fr] gap-6 p-6">
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-brand-dark p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-3xl bg-brand-accent/10 p-3 text-brand-accent">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-brand-muted">Availability</p>
                  <p className="mt-2 text-sm text-zinc-300">Choose a format and pick a time slot that works for your schedule. Your coach will confirm the request shortly.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-brand-dark p-5">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-brand-muted">Consultation format</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Online or Offline</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(['online', 'offline'] as ConsultationFormat[]).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setSelectedFormat(format)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      selectedFormat === format
                        ? 'border-brand-accent bg-brand-accent/10 text-white'
                        : 'border-white/10 bg-[#111318] text-brand-muted hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {format === 'online' ? <Laptop className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      <span className="font-semibold text-sm capitalize">{format}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      {format === 'online'
                        ? 'Video session with a secure call link.'
                        : 'In-person meeting details shared after confirmation.'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-brand-dark p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-brand-muted">Available slots ({getUserTimezoneOffset()})</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Select a time</h3>
                </div>
                <span className="text-[11px] text-brand-muted">{selectedFormat.toUpperCase()}</span>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-16 rounded-3xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-6 text-sm text-brand-muted">
                  No open slots are available right now. Please request a booking and the coach will follow up with alternatives.
                </div>
              ) : (
                <div className="space-y-3">
                  {availableSlots.map((slot) => {
                    const { formattedDate, formattedStart, formattedEnd, tzLabel } = formatTimeRangeInUserTimezone(slot.startsAt, slot.endsAt);
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`w-full rounded-3xl border p-4 text-left transition ${
                          selectedSlotId === slot.id
                            ? 'border-brand-accent bg-brand-accent/10 text-white'
                            : 'border-white/10 bg-[#111318] text-brand-muted hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-white">{formattedDate}</p>
                            <p className="text-[11px] text-zinc-400 mt-1">
                              {formattedStart} – {formattedEnd} <span className="text-brand-accent font-mono">({tzLabel})</span>
                            </p>
                          </div>
                          <div className="text-[11px] uppercase tracking-[0.24em] text-brand-muted">{slot.format}</div>
                        </div>
                        <p className="mt-3 text-[11px] text-zinc-400">{slot.location}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d1016] p-5 space-y-5">
            <div className="rounded-3xl bg-brand-dark/80 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-brand-muted">Coach details</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Calendar className="w-4 h-4 text-brand-accent" />
                  <span>{coach.availability}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <MapPin className="w-4 h-4 text-brand-accent" />
                  <span>{coach.location}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Clock3 className="w-4 h-4 text-brand-accent" />
                  <span>{coach.yearsExperience} years experience</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-brand-dark/80 p-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-brand-muted">Athlete</p>
              <div className="text-sm text-zinc-300">{athleteProfile?.name ?? 'Please sign in to book'}</div>
              <div className="text-[11px] text-zinc-500">Bookings are created as requests. Coach confirmation may follow after review.</div>
            </div>

            {error && (
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-300" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {success ? (
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-300" />
                  <div>
                    <p className="font-semibold text-white">Booking request sent</p>
                    <p className="text-[11px] text-zinc-400">Your coach will confirm the {selectedSlot?.format} consultation soon.</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleBook}
                disabled={isBooking || !selectedSlot || !isAuthenticated}
                className="w-full rounded-3xl bg-brand-accent py-4 text-sm font-semibold text-black transition hover:bg-brand-accentHover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAuthenticated ? (isBooking ? 'Requesting Booking...' : 'Request Consultation') : 'Sign In to Book'}
              </button>
            )}

            <div className="rounded-3xl border border-brand-accent/20 bg-brand-accent/10 p-4 text-[11px] text-zinc-300">
              <div className="flex items-center gap-2 text-brand-accent">
                <Video className="w-4 h-4" />
                <span className="font-semibold">Built-in video calling</span>
              </div>
              <p className="mt-2 leading-relaxed">Once the booking is confirmed, both participants will be able to join a secure meeting room directly from their dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
