import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, Users, Sparkles, Bell, MessageSquare, RefreshCw,
} from 'lucide-react';
import { fetchCoachApplications, updateApplicationStatus } from '../../services/coachListingService';
import type { ListingApplication, ApplicationStatus } from '../../types';

const statusStyle = (status: ApplicationStatus) => {
  if (status === 'pending') return { bg: 'bg-amber-400/15 border-amber-400/30', text: 'text-amber-400', label: 'Pending' };
  if (status === 'accepted') return { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', label: 'Accepted' };
  return { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', label: 'Declined' };
};

export const CoachApplicationsView: React.FC = () => {
  const { currentProfile, addNotification, notifications } = useApp();
  const [applications, setApplications] = useState<ListingApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const coachProfileId = currentProfile?.profile.id ?? '';

  const load = async () => {
    if (!coachProfileId) return;
    setIsLoading(true);
    const data = await fetchCoachApplications(coachProfileId);
    setApplications(data);
    setIsLoading(false);
  };

  useEffect(() => { void load(); }, [coachProfileId]);

  const handleUpdateStatus = async (appId: string, status: ApplicationStatus, athleteName: string) => {
    setProcessingId(appId);
    const ok = await updateApplicationStatus(appId, status);
    if (ok) {
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a));
      addNotification({
        type: status === 'accepted' ? 'success' : 'info',
        title: status === 'accepted' ? 'Application accepted' : 'Application declined',
        message: `${athleteName}'s application has been ${status}.`,
      });
    }
    setProcessingId(null);
  };

  const filtered = filter === 'all' ? applications : applications.filter((a) => a.status === filter);
  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="liquid-shell min-h-screen pb-24 pt-10 sm:pt-14">
      <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="section-eyebrow mb-1">Applications</p>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white">
              Athlete Applications
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {pendingCount > 0 ? `${pendingCount} pending — review and respond` : 'All caught up'}
            </p>
          </div>
          <button
            onClick={() => void load()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border text-brand-muted hover:text-white hover:bg-white/10 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-brand-card border border-brand-border w-fit">
          {(['all', 'pending', 'accepted', 'declined'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                filter === f ? 'bg-white text-black' : 'text-brand-muted hover:text-white'
              }`}
            >
              {f === 'all' ? `All (${applications.length})` : f}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-brand-card border border-brand-border animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel p-10 rounded-3xl border border-brand-border text-center space-y-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-elevated border border-brand-border flex items-center justify-center mx-auto text-brand-muted">
              <Bell className="w-7 h-7" />
            </div>
            <div className="font-semibold text-white">{filter === 'all' ? 'No applications yet' : `No ${filter} applications`}</div>
            <p className="text-xs text-brand-muted max-w-xs mx-auto">
              {filter === 'all' ? 'Once athletes apply to your listings, they will appear here.' : `Switch to "All" to see all applications.`}
            </p>
          </motion.div>
        )}

        {/* Application Cards */}
        {!isLoading && (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((app) => {
                const st = statusStyle(app.status);
                const isProcessing = processingId === app.id;
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-panel p-5 rounded-2xl border border-brand-border"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {app.athleteAvatar ? (
                        <img src={app.athleteAvatar} alt={app.athleteName} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-brand-elevated border border-brand-border flex items-center justify-center text-zinc-400 shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="font-semibold text-white text-sm">{app.athleteName}</div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${st.bg} ${st.text}`}>
                              {st.label}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {app.message && (
                          <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-brand-dark border border-brand-border/60">
                            <MessageSquare className="w-3.5 h-3.5 text-brand-muted shrink-0 mt-0.5" />
                            <p className="text-xs text-zinc-300 leading-relaxed">{app.message}</p>
                          </div>
                        )}

                        {/* Actions */}
                        {app.status === 'pending' && (
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={() => void handleUpdateStatus(app.id, 'accepted', app.athleteName)}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accept
                            </button>
                            <button
                              onClick={() => void handleUpdateStatus(app.id, 'declined', app.athleteName)}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
