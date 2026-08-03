import React, { useState } from 'react';
import { X, HeartPulse, Smile, Zap, CloudRain, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { createWellbeingCheckIn } from '../../services/progressService';

interface WellbeingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitWellbeing: (tag: string, note: string) => void;
}

const wellbeingOptions = [
  { label: 'Fatigue', value: 'fatigue', icon: Zap },
  { label: 'Tiredness', value: 'tiredness', icon: Moon },
  { label: 'Sadness', value: 'sadness', icon: CloudRain },
  { label: 'Apathy', value: 'apathy', icon: HeartPulse },
  { label: 'Motivation', value: 'motivation', icon: Smile },
];

export const WellbeingModal: React.FC<WellbeingModalProps> = ({ isOpen, onClose, onSubmitWellbeing }) => {
  const [selected, setSelected] = useState<string>('fatigue');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentProfile, addAthleteInsight } = useApp();
  const profile = currentProfile;

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const athleteId = profile?.profile.id;
    if (!athleteId) return;

    setIsSubmitting(true);
    setError(null);

    const trimmedNote = note.trim();

    // Реальное сохранение: пишет в athlete_progress_logs, coach_id
    // подставляется автоматически на стороне БД (триггер), тренер
    // видит запись сразу через свою realtime-подписку.
    const savedLog = await createWellbeingCheckIn({
      athleteId,
      mood: selected,
      note: trimmedNote,
    });

    setIsSubmitting(false);

    if (!savedLog) {
      setError('Не удалось сохранить чек-ин. Проверьте, что у вас есть назначенный тренер, и попробуйте снова.');
      return;
    }

    onSubmitWellbeing(selected, trimmedNote);
    addAthleteInsight({
      athleteId,
      athleteName: profile?.profile.name ?? 'Athlete',
      mood: selected,
      summary: `Wellbeing update: ${selected}`,
      note: trimmedNote || 'No additional comment provided.',
      source: 'wellbeing',
    });
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/80 p-4 py-4 backdrop-blur-sm sm:py-6">
      <div className="w-full max-w-2xl rounded-[28px] bg-[#111318] border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-muted">Athlete wellbeing</p>
            <h2 className="mt-2 text-xl font-extrabold text-white">How are you feeling?</h2>
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
            <p className="text-sm text-zinc-300">Choose the feeling that best matches your current state. This helps the coach or support specialist respond with care.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {wellbeingOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelected(option.value)}
                  className={`rounded-3xl border p-4 text-center transition ${
                    selected === option.value
                      ? 'border-brand-accent bg-brand-accent/10 text-white'
                      : 'border-white/10 bg-[#111318] text-brand-muted hover:border-white/20'
                  }`}
                >
                  <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-brand-accent">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-[0.28em] text-brand-muted">Tell us more</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full rounded-3xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none focus:border-brand-accent"
              placeholder="I'm feeling tired because..."
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-3xl bg-brand-accent py-4 text-sm font-semibold text-black transition hover:bg-brand-accentHover disabled:opacity-60"
          >
            {isSubmitting ? 'Sending…' : 'Send support request'}
          </button>
        </div>
      </div>
    </div>
  );
};