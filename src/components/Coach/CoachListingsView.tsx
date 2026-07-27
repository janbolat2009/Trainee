import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit3, Trash2, Pause, Play, MapPin, DollarSign, Users, Wifi,
  WifiOff, Layers, CheckCircle2, AlertCircle, Sparkles, Clock,
} from 'lucide-react';
import { fetchCoachListings, deleteListing, updateListing } from '../../services/coachListingService';
import { CreateListingModal } from './CreateListingModal';
import type { CoachListing } from '../../types';

const FormatIcon: React.FC<{ format: CoachListing['trainingFormat'] }> = ({ format }) => {
  if (format === 'online') return <Wifi className="w-3.5 h-3.5 text-emerald-400" />;
  if (format === 'offline') return <WifiOff className="w-3.5 h-3.5 text-zinc-400" />;
  return <Layers className="w-3.5 h-3.5 text-brand-accent" />;
};

const statusBadge = (status: CoachListing['status']) => {
  if (status === 'active') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (status === 'paused') return 'bg-amber-400/20 text-amber-400 border-amber-400/30';
  return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
};

export const CoachListingsView: React.FC = () => {
  const { currentProfile, setIsCreateListingOpen, isCreateListingOpen, addNotification } = useApp();
  const [listings, setListings] = useState<CoachListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingListing, setEditingListing] = useState<CoachListing | undefined>(undefined);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const coachProfileId = currentProfile?.profile.id ?? '';

  const load = async () => {
    if (!coachProfileId) return;
    setIsLoading(true);
    const data = await fetchCoachListings(coachProfileId);
    setListings(data);
    setIsLoading(false);
  };

  useEffect(() => { void load(); }, [coachProfileId]);

  const handleToggleStatus = async (listing: CoachListing) => {
    const newStatus = listing.status === 'active' ? 'paused' : 'active';
    const ok = await updateListing(listing.id, { status: newStatus });
    if (ok) {
      setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, status: newStatus } : l));
      addNotification({ type: 'info', title: 'Listing updated', message: `Listing set to ${newStatus}.` });
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const ok = await deleteListing(id);
    if (ok) {
      setListings((prev) => prev.filter((l) => l.id !== id));
      addNotification({ type: 'info', title: 'Listing deleted', message: 'The listing has been removed.' });
    }
    setDeletingId(null);
  };

  const handleSaved = (saved: CoachListing) => {
    setListings((prev) => {
      const idx = prev.findIndex((l) => l.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setIsEditOpen(false);
    setIsCreateListingOpen(false);
  };

  const isEmpty = !isLoading && listings.length === 0;

  return (
    <div className="liquid-shell min-h-screen pb-24 pt-10 sm:pt-14">
      <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="section-eyebrow mb-1">Listings</p>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white">My Training Listings</h1>
            <p className="mt-1 text-sm text-zinc-400">{listings.length} listing{listings.length !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={() => setIsCreateListingOpen(true)}
            className="flex items-center space-x-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-glow-white"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Listing</span>
          </button>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-3xl bg-brand-card border border-brand-border animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel-elevated p-10 rounded-3xl border border-brand-accent/20 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center mx-auto text-brand-accent">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">No listings yet</h3>
              <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
                Create your first listing to attract athletes. Tell them about your specialization, format, and rates.
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

        {/* Listings Grid */}
        {!isLoading && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {listings.map((listing, idx) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-panel p-5 rounded-3xl border border-brand-border flex flex-col justify-between space-y-4 hover:border-zinc-700 transition"
                >
                  {/* Top */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-white text-sm">{listing.sport}</h3>
                        {listing.specialization && (
                          <p className="text-xs text-brand-muted mt-0.5">{listing.specialization}</p>
                        )}
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${statusBadge(listing.status)}`}>
                        {listing.status.toUpperCase()}
                      </span>
                    </div>

                    {listing.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{listing.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-[11px] font-mono text-brand-muted">
                      <span className="flex items-center gap-1">
                        <FormatIcon format={listing.trainingFormat} />
                        <span className="capitalize">{listing.trainingFormat}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {listing.athleteLevel}
                      </span>
                      {listing.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {listing.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-brand-accent font-bold">
                        <DollarSign className="w-3.5 h-3.5" />
                        {listing.price} / {listing.billingPeriod}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(listing.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-brand-border/60">
                    <button
                      onClick={() => { setEditingListing(listing); setIsEditOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-elevated border border-brand-border text-xs font-medium text-white hover:bg-white/10 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    <button
                      onClick={() => void handleToggleStatus(listing)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-elevated border border-brand-border text-xs font-medium text-zinc-300 hover:text-white transition"
                    >
                      {listing.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {listing.status === 'active' ? 'Pause' : 'Activate'}
                    </button>

                    <button
                      onClick={() => void handleDelete(listing.id)}
                      disabled={deletingId === listing.id}
                      className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateListingOpen && (
          <CreateListingModal
            isOpen={isCreateListingOpen}
            onClose={() => setIsCreateListingOpen(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditOpen && editingListing && (
          <CreateListingModal
            isOpen={isEditOpen}
            onClose={() => { setIsEditOpen(false); setEditingListing(undefined); }}
            existingListing={editingListing}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
