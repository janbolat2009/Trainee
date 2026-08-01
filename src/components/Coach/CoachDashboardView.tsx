import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FileText, Users, Bell, Plus, TrendingUp, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, Sparkles, ArrowRight, Calendar,
} from 'lucide-react';
import { fetchCoachListings, fetchCoachApplications } from '../../services/coachListingService';
import { fetchCoachStudents } from '../../services/progressService';
import { fetchCoachBookings, saveConsultationReminder, saveConsultationFeedback } from '../../services/bookingService';
import { ReminderModal } from '../Notifications/ReminderModal';
import { PostConsultationFeedbackModal } from '../Feedback/PostConsultationFeedbackModal';
import type { CoachListing, ListingApplication, CoachStudent, ConsultationBooking } from '../../types';
import { VideoMeetingModal } from '../Meetings/VideoMeetingModal';

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string }> = ({
  icon, label, value, sub, color = 'text-white',
}) => (
  <motion.div whileHover={{ y: -2 }} className="glass-panel p-5 rounded-2xl border border-brand-border flex items-center justify-between">
    <div>
      <div className="text-[11px] font-mono uppercase text-brand-muted">{label}</div>
      <div className={`text-2xl font-black font-mono mt-1 ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-zinc-500 font-mono mt-1">{sub}</div>}
    </div>
    <div className="p-3 rounded-xl bg-brand-elevated border border-brand-border text-zinc-300">{icon}</div>
  </motion.div>
);

export const CoachDashboardView: React.FC = () => {
  const { currentProfile, setActiveTab, setIsCreateListingOpen, addNotification, activeMeetingBooking, setActiveMeetingBooking } = useApp();
  const [listings, setListings] = useState<CoachListing[]>([]);
  const [applications, setApplications] = useState<ListingApplication[]>([]);
  const [students, setStudents] = useState<CoachStudent[]>([]);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReminderBooking, setSelectedReminderBooking] = useState<ConsultationBooking | null>(null);
  const [selectedFeedbackBooking, setSelectedFeedbackBooking] = useState<ConsultationBooking | null>(null);
  const [prevPendingBookings, setPrevPendingBookings] = useState(0);

  const coachName = currentProfile?.profile.name ?? 'Coach';
  const coachProfileId = currentProfile?.profile.id ?? '';

  useEffect(() => {
    if (!coachProfileId) return;
    const load = async () => {
      setIsLoading(true);
      const [l, a, s, b] = await Promise.all([
        fetchCoachListings(coachProfileId),
        fetchCoachApplications(coachProfileId),
        fetchCoachStudents(coachProfileId),
        fetchCoachBookings(coachProfileId),
      ]);
      setListings(l);
      setApplications(a);
      setStudents(s);
      setBookings(b);
      setIsLoading(false);
    };
    void load();
  }, [coachProfileId]);

  useEffect(() => {
    if (isLoading) return;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    if (pending > 0 && pending !== prevPendingBookings) {
      addNotification({
        type: 'info',
        title: 'Booking requests',
        message: `You have ${pending} pending consultation request${pending === 1 ? '' : 's'}.`,
      });
    }
    setPrevPendingBookings(pending);
  }, [bookings, isLoading, prevPendingBookings, addNotification]);

  const activeListings = listings.filter((l) => l.status === 'active').length;
  const pendingApps = applications.filter((a) => a.status === 'pending').length;
  const upcomingBookings = bookings.filter((b) => b.status !== 'cancelled').length;
  const recentApps = applications.slice(0, 3);
  const recentBookings = bookings.slice(0, 3);

  return (
    <div className="liquid-shell min-h-screen pb-24 pt-10 sm:pt-14">
      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">

        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <p className="section-eyebrow mb-1">Coach Dashboard</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
              Welcome back, {coachName.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">Manage your listings, applications, and student progress.</p>
          </div>

          <button
            onClick={() => setIsCreateListingOpen(true)}
            className="flex items-center space-x-2 self-start sm:self-auto rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-glow-white"
          >
            <Plus className="w-4 h-4" />
            <span>Create Listing</span>
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FileText className="w-5 h-5 text-brand-accent" />}
            label="Active Listings"
            value={isLoading ? '—' : activeListings}
            sub={`${listings.length} total`}
            color="text-brand-accent"
          />
          <StatCard
            icon={<Bell className="w-5 h-5 text-amber-400" />}
            label="Pending Applications"
            value={isLoading ? '—' : pendingApps}
            sub={`${applications.length} total`}
            color={pendingApps > 0 ? 'text-amber-400' : 'text-white'}
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-emerald-400" />}
            label="Active Students"
            value={isLoading ? '—' : students.length}
            sub="accepted athletes"
            color="text-emerald-400"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            label="Avg. Progress"
            value="—"
            sub="log data to track"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-brand-accent" />}
            label="Upcoming Bookings"
            value={isLoading ? '—' : upcomingBookings}
            sub={`${bookings.length} total`}
            color="text-brand-accent"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 rounded-3xl border border-brand-border space-y-4"
          >
            <h2 className="text-base font-semibold text-white">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setIsCreateListingOpen(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-brand-dark border border-brand-border hover:border-zinc-600 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-brand-accent/20 text-brand-accent">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white text-sm">Create Listing</div>
                    <div className="text-xs text-brand-muted">Attract new athletes to your program</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-muted group-hover:text-white transition" />
              </button>

              <button
                onClick={() => setActiveTab('coach-applications')}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-brand-dark border border-brand-border hover:border-zinc-600 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white text-sm">Review Applications</div>
                    <div className="text-xs text-brand-muted">{pendingApps} awaiting your response</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-muted group-hover:text-white transition" />
              </button>

              <button
                onClick={() => setActiveTab('coach-students')}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-brand-dark border border-brand-border hover:border-zinc-600 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white text-sm">Monitor Students</div>
                    <div className="text-xs text-brand-muted">Real-time progress tracking</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-muted group-hover:text-white transition" />
              </button>
            </div>
          </motion.div>

          {/* Booking Requests */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-panel p-6 rounded-3xl border border-brand-border space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Booking Requests</h2>
              <span className="text-xs text-brand-muted">{bookings.filter((b) => b.status === 'pending').length} pending</span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-brand-dark border border-brand-border animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="p-4 rounded-2xl bg-brand-elevated border border-brand-border">
                  <Calendar className="w-8 h-8 text-brand-muted" />
                </div>
                <div className="text-sm font-medium text-white">No bookings yet</div>
                <div className="text-xs text-brand-muted max-w-48">Your consultation requests will appear here once athletes book sessions.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="rounded-3xl border border-brand-border bg-brand-dark p-4">
                    <div className="flex items-center justify-between gap-3 text-sm text-white">
                      <div>
                        <div className="font-semibold">{booking.athleteName}</div>
                        <div className="text-[11px] text-brand-muted">{new Date(booking.startsAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <span className="rounded-full px-2 py-1 text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20">{booking.status.toUpperCase()}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedReminderBooking(booking)}
                        className="rounded-2xl border border-brand-border bg-white/5 px-3 py-2 text-[11px] text-white hover:bg-white/10 transition"
                      >
                        Set reminder
                      </button>
                      <button
                        onClick={() => setSelectedFeedbackBooking(booking)}
                        className="rounded-2xl border border-brand-border bg-white/5 px-3 py-2 text-[11px] text-white hover:bg-white/10 transition"
                      >
                        Add feedback
                      </button>
                      <button
                        onClick={() => setActiveMeetingBooking(booking)}
                        className="rounded-2xl border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-[11px] font-semibold text-brand-accent hover:bg-brand-accent/20 transition"
                      >
                        Join meeting
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        {/* Recent Applications */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-panel p-6 rounded-3xl border border-brand-border space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Recent Applications</h2>
              <button
                onClick={() => setActiveTab('coach-applications')}
                className="flex items-center space-x-1 text-xs text-brand-muted hover:text-white transition"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-brand-dark border border-brand-border animate-pulse" />
                ))}
              </div>
            ) : recentApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="p-4 rounded-2xl bg-brand-elevated border border-brand-border">
                  <Sparkles className="w-8 h-8 text-brand-muted" />
                </div>
                <div className="text-sm font-medium text-white">No applications yet</div>
                <div className="text-xs text-brand-muted max-w-48">Create an active listing and athletes will start applying</div>
                <button
                  onClick={() => setIsCreateListingOpen(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition"
                >
                  Create your first listing
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApps.map((app) => (
                  <div key={app.id} className="flex items-center space-x-3 p-3.5 rounded-2xl bg-brand-dark border border-brand-border">
                    {app.athleteAvatar ? (
                      <img src={app.athleteAvatar} alt={app.athleteName} className="w-9 h-9 rounded-xl object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-brand-elevated border border-brand-border flex items-center justify-center text-zinc-400">
                        <Users className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-xs truncate">{app.athleteName}</div>
                      <div className="text-[10px] text-brand-muted truncate">{app.message || 'No message'}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      app.status === 'pending' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' :
                      app.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {app.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* No listings CTA */}
        {!isLoading && listings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel-elevated p-8 rounded-3xl border border-brand-accent/20 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center mx-auto text-brand-accent">
              <LayoutDashboard className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">You don't have any listings yet</h3>
              <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
                Create your first listing to start attracting athletes. Describe your specialization, format, and pricing.
              </p>
            </div>
            <button
              onClick={() => setIsCreateListingOpen(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition shadow-glow-white"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Listing</span>
            </button>
          </motion.div>
        )}
      </div>
      <ReminderModal
        isOpen={Boolean(selectedReminderBooking)}
        onClose={() => setSelectedReminderBooking(null)}
        booking={selectedReminderBooking}
        onReminderSet={async (bookingId, reminder) => {
          await saveConsultationReminder(bookingId, reminder);
          addNotification({
            type: 'success',
            title: 'Reminder saved',
            message: 'Your consultation reminder has been saved locally.',
          });
        }}
      />
      <PostConsultationFeedbackModal
        isOpen={Boolean(selectedFeedbackBooking)}
        onClose={() => setSelectedFeedbackBooking(null)}
        booking={selectedFeedbackBooking}
        onFeedbackSubmit={async (bookingId, comment, rating) => {
          await saveConsultationFeedback(bookingId, rating, comment);
          addNotification({
            type: 'success',
            title: 'Feedback saved',
            message: 'Your post-consultation feedback was saved.',
          });
        }}
      />
      <VideoMeetingModal booking={activeMeetingBooking} onClose={() => setActiveMeetingBooking(null)} />
    </div>
  );
};
