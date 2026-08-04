import React, { useState } from 'react';
import { X, Bell, Clock } from 'lucide-react';
import type { ConsultationBooking } from '../../types';
import { formatFullDateTimeInUserTimezone } from '../../lib/dateUtils';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: ConsultationBooking | null;
  onReminderSet: (bookingId: string, reminder: string) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, booking, onReminderSet }) => {
  const [reminder, setReminder] = useState('15 minutes before');

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/75 p-4 py-4 backdrop-blur-sm sm:py-6">
      <div className="w-full max-w-xl rounded-[28px] bg-[#111318] border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-muted">Reminder</p>
            <h2 className="mt-2 text-xl font-extrabold text-white">Upcoming consultation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-brand-muted hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-3xl border border-white/10 bg-brand-dark p-5 flex items-start gap-4">
            <div className="rounded-3xl bg-brand-accent/10 p-3 text-brand-accent">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-brand-muted">Consultation</p>
              <p className="mt-2 text-sm text-zinc-300">{formatFullDateTimeInUserTimezone(booking.startsAt)}</p>
              <p className="text-xs text-zinc-500 mt-2">{booking.format === 'online' ? 'Online session' : 'In-person meeting'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-[0.28em] text-brand-muted">Reminder time</label>
            <select
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none focus:border-brand-accent"
            >
              <option>15 minutes before</option>
              <option>30 minutes before</option>
              <option>1 hour before</option>
              <option>1 day before</option>
            </select>
          </div>

          <button
            onClick={() => {
              onReminderSet(booking.id, reminder);
              onClose();
            }}
            className="w-full rounded-3xl bg-brand-accent py-4 text-sm font-semibold text-black transition hover:bg-brand-accentHover"
          >
            Set reminder
          </button>
        </div>
      </div>
    </div>
  );
};
