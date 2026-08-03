import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, CalendarClock, CircleCheckBig, CircleAlert, X, Video, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ReminderItem } from '../../types';

const statusStyles: Record<ReminderItem['status'], string> = {
  scheduled: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
  triggered: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  dismissed: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
};

export const NotificationCenter: React.FC = () => {
  const {
    isNotificationsOpen, setIsNotificationsOpen, reminders,
    markReminderAsRead, dismissReminder, markReminderAsCompleted,
    notifications, markAllNotificationsAsRead
  } = useApp();

  React.useEffect(() => {
    if (isNotificationsOpen) {
      markAllNotificationsAsRead();
    }
  }, [isNotificationsOpen]);

  const visibleReminders = reminders.slice().sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

  if (!isNotificationsOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/75 p-3 py-4 sm:items-center sm:p-6 sm:py-6"
      >
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.98 }}
          className="w-full max-w-2xl rounded-[32px] border border-brand-border bg-brand-card p-4 shadow-2xl sm:p-5"
        >
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-brand-muted">Notification Center</p>
              <h2 className="text-xl font-semibold text-white">Upcoming reminders & sessions</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs text-brand-accent hover:underline font-medium px-2 py-1"
              >
                Mark all read
              </button>
              <button onClick={() => setIsNotificationsOpen(false)} className="rounded-full bg-white/5 p-2 text-brand-muted transition hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <section className="rounded-3xl border border-brand-border bg-brand-dark/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <BellRing className="h-4 w-4 text-brand-accent" />
                <span>Session reminders</span>
              </div>
              {visibleReminders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-brand-border p-4 text-sm text-brand-muted">No reminders yet. Book a consultation to receive automated reminders.</div>
              ) : (
                <div className="space-y-3">
                  {visibleReminders.map((reminder) => (
                    <div key={reminder.id} className={`rounded-2xl border p-4 ${reminder.isUnread ? 'border-brand-accent/40 bg-brand-accent/10' : 'border-brand-border bg-brand-dark/60'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{reminder.title}</p>
                          <p className="mt-1 text-xs text-brand-muted">{reminder.message}</p>
                          <p className="mt-2 text-[11px] text-zinc-400">Scheduled for {new Date(reminder.scheduledFor).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${statusStyles[reminder.status]}`}>{reminder.status}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {reminder.status !== 'completed' && (
                          <button onClick={() => markReminderAsCompleted(reminder.id)} className="rounded-xl border border-brand-accent/20 bg-brand-accent/10 px-3 py-2 text-[11px] font-semibold text-brand-accent">Mark complete</button>
                        )}
                        <button onClick={() => markReminderAsRead(reminder.id)} className="rounded-xl border border-brand-border bg-white/5 px-3 py-2 text-[11px] text-white">{reminder.isUnread ? 'Mark read' : 'Keep unread'}</button>
                        <button onClick={() => dismissReminder(reminder.id)} className="rounded-xl border border-brand-border bg-white/5 px-3 py-2 text-[11px] text-white">Dismiss</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-brand-border bg-brand-dark/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <CalendarClock className="h-4 w-4 text-brand-accent" />
                <span>In-app activity</span>
              </div>
              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-brand-border p-4 text-sm text-brand-muted">You’re all caught up.</div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 6).map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-brand-border bg-brand-dark/60 p-3">
                      <div className="rounded-xl bg-white/5 p-2 text-brand-accent">
                        {item.type === 'success' ? <CircleCheckBig className="h-4 w-4" /> : item.type === 'warning' ? <CircleAlert className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-brand-muted">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
