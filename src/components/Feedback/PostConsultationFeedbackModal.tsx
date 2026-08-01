import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import type { ConsultationBooking } from '../../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: ConsultationBooking | null;
  onFeedbackSubmit: (bookingId: string, comment: string, rating: number) => void;
}

export const PostConsultationFeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, booking, onFeedbackSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/80 p-4 py-4 backdrop-blur-sm sm:py-6">
      <div className="w-full max-w-2xl rounded-[28px] bg-[#111318] border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-muted">Feedback</p>
            <h2 className="mt-2 text-xl font-extrabold text-white">Review your consultation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-brand-muted hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-3xl border border-white/10 bg-brand-dark p-5">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-brand-muted">
              <Star className="w-4 h-4 text-brand-accent" />
              <span>{booking.format === 'online' ? 'Online session' : 'In-person session'}</span>
            </div>
            <p className="mt-3 text-sm text-zinc-300">
              Tell us how the session went and help the coach improve the next training plan.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <span className="block text-xs uppercase tracking-[0.28em] text-brand-muted">Rating</span>
              <div className="mt-3 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${rating >= value ? 'bg-brand-accent text-black' : 'bg-white/5 text-zinc-300 hover:bg-white/10'}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.28em] text-brand-muted">Feedback</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="mt-3 w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none focus:border-brand-accent"
                placeholder="Share what went well, what could improve, or how you felt after the session."
              />
            </div>
          </div>

          <button
            onClick={() => {
              onFeedbackSubmit(booking.id, comment.trim(), rating);
              onClose();
            }}
            className="w-full rounded-3xl bg-brand-accent py-4 text-sm font-semibold text-black transition hover:bg-brand-accentHover"
          >
            Submit feedback
          </button>
        </div>
      </div>
    </div>
  );
};
