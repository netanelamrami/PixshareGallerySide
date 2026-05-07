import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, Phone, User, Mail, MessageSquare } from 'lucide-react';
import { apiService } from '@/data/services/apiService';

interface LeadBannerProps {
  eventId: number;
  language: 'he' | 'en';
}

type BannerState = 'banner' | 'form' | 'success' | 'hidden';

const SUBMITTED_KEY  = (id: number) => `pxlead_submitted_${id}`;
const DISMISSED_KEY  = (id: number) => `pxlead_dismissed_${id}`;
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function shouldSkip(eventId: number) {
  if (localStorage.getItem(SUBMITTED_KEY(eventId)) === '1') return true;
  const raw = localStorage.getItem(DISMISSED_KEY(eventId));
  if (raw) {
    const ts = parseInt(raw, 10);
    if (!isNaN(ts) && Date.now() - ts < DISMISS_TTL_MS) return true;
    localStorage.removeItem(DISMISSED_KEY(eventId));
  }
  return false;
}

export function LeadBanner({ eventId, language }: LeadBannerProps) {
  const isHe = language === 'he';
  const [bannerState, setBannerState] = useState<BannerState>(() =>
    shouldSkip(eventId) ? 'hidden' : 'banner'
  );

  // Form fields
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [email, setEmail]     = useState('');
  const [note, setNote]       = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]     = useState('');

  // Auto-hide success after 3s
  useEffect(() => {
    if (bannerState !== 'success') return;
    const t = setTimeout(() => setBannerState('hidden'), 3000);
    return () => clearTimeout(t);
  }, [bannerState]);

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(DISMISSED_KEY(eventId), Date.now().toString());
    setBannerState('hidden');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError(isHe ? 'שם וטלפון הם שדות חובה' : 'Name and phone are required');
      return;
    }
    setIsSubmitting(true);
    const result = await apiService.submitLead({
      eventId, name: name.trim(), phone: phone.trim(),
      email: email.trim() || undefined, note: note.trim() || undefined,
    });
    setIsSubmitting(false);
    if (result.success || result.isDuplicate) {
      localStorage.setItem(SUBMITTED_KEY(eventId), '1');
      setBannerState('success');
    } else {
      setError(isHe ? 'אירעה שגיאה, נסה שוב' : 'Something went wrong, please try again');
    }
  };

  if (bannerState === 'hidden') return null;

  // ── Success state ───────────────────────────────────────────────────────────
  if (bannerState === 'success') {
    return (
      <div className="w-full px-3 pb-3" dir={isHe ? 'rtl' : 'ltr'}>
        <div className="w-full rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-6 py-5 flex items-center justify-center gap-3">
          <CheckCircle2 className="h-7 w-7 text-green-500 flex-shrink-0" />
          <p className="font-semibold text-green-800 dark:text-green-200">
            {isHe ? '🎉 תודה רבה! נחזור אליך בהקדם' : "🎉 Thank you! We'll be in touch soon"}
          </p>
        </div>
      </div>
    );
  }

  // ── Lead form ───────────────────────────────────────────────────────────────
  if (bannerState === 'form') {
    return (
      <div className="w-full px-3 pb-3" dir={isHe ? 'rtl' : 'ltr'}>
        <div className="w-full rounded-2xl bg-background border border-border shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b">
            <h3 className="font-semibold text-sm text-foreground">
              {isHe ? 'השאר פרטים ונחזור אליך' : "Leave details and we'll be in touch"}
            </h3>
            <button
              type="button"
              onClick={() => setBannerState('banner')}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="relative">
                <User className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder={isHe ? 'שם מלא *' : 'Full name *'} required
                  className="w-full ps-8 pe-2 py-2.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>
              <div className="relative">
                <Phone className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder={isHe ? 'טלפון *' : 'Phone *'} required
                  dir={phone ? 'ltr' : undefined}
                  className="w-full ps-8 pe-2 py-2.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder={isHe ? 'מייל (אופציונלי)' : 'Email (optional)'}
                className="w-full ps-8 pe-2 py-2.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>

            <div className="relative">
              <MessageSquare className="absolute start-2.5 top-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <textarea
                value={note} onChange={e => setNote(e.target.value)} rows={2}
                placeholder={isHe ? 'הערות — סוג אירוע, תאריך... (אופציונלי)' : 'Notes — event type, date... (optional)'}
                className="w-full ps-8 pe-2 py-2.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="submit" disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60"
            >
              {isSubmitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : (isHe ? 'שלח פרטים' : 'Send details')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Ad banner — the design image ────────────────────────────────────────────
  return (
    <div className="w-full px-3 pb-3 relative">
      {/* Dismiss button — floats above the image */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="dismiss"
        className="absolute top-2 end-5 z-10 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition"
      >
        <X className="h-3.5 w-3.5 text-white" />
      </button>

      {/* Clickable banner image — capped height on desktop, centered if narrow */}
      <button
        type="button"
        onClick={() => setBannerState('form')}
        className="w-full rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 flex items-center justify-center"
        style={{ maxHeight: '28vh' }}
      >
        <img
          src="/lead-banner.png"
          alt={isHe ? 'רוצים שגם האורחים שלכם יקבלו את התמונות שלהם?' : 'Want your guests to receive their photos?'}
          className="w-auto h-full object-contain"
          style={{ maxHeight: '28vh' }}
          draggable={false}
        />
      </button>
    </div>
  );
}
