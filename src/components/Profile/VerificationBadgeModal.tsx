import React from 'react';
import { Coach } from '../../types';
import { ShieldCheck, Award, X, CheckCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface VerificationModalProps {
  coach: Coach;
  isOpen: boolean;
  onClose: () => void;
}

export const VerificationBadgeModal: React.FC<VerificationModalProps> = ({ coach, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-4 py-4 bg-black/80 backdrop-blur-md sm:py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center text-brand-accent">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-brand-accent">OFFICIAL AUDIT PASS</div>
            <h3 className="text-xl font-extrabold text-white uppercase tracking-tight">
              Verified Credentials
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-dark border border-brand-border mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={coach.avatar} alt={coach.name} className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <div className="font-bold text-white text-sm">{coach.name}</div>
              <div className="text-xs text-brand-muted">{coach.verificationBadge}</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase">
            AUDITED
          </span>
        </div>

        {/* Certificate List */}
        <div className="space-y-3 mb-6">
          <div className="text-xs font-mono uppercase text-brand-muted">Registered Certifications</div>
          {coach.certifications.map((cert, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-brand-dark/50 border border-brand-border/60 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-brand-accent" />
                  <span className="font-bold text-white text-xs">{cert.title}</span>
                </div>
                <div className="text-[11px] text-brand-muted mt-1">
                  Issued by <strong className="text-zinc-300">{cert.issuer}</strong> ({cert.year})
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">VERIFIED</span>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-xl bg-brand-elevated border border-brand-border text-[11px] text-brand-muted font-mono flex items-center justify-between">
          <span>Verification Hash: 0x8F9A...4B21</span>
          <span className="text-brand-accent font-bold">TRAINEE TRUST ENGINE</span>
        </div>

        <div className="mt-6 pt-4 border-t border-brand-border/60">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition"
          >
            Close Verification Sheet
          </button>
        </div>

      </motion.div>
    </div>
  );
};
