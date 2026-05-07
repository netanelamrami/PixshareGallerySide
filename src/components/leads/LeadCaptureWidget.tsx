import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, Phone, User, Mail, MessageSquare } from 'lucide-react';
import { apiService } from '@/data/services/apiService';

interface LeadCaptureWidgetProps {
  eventId: number;
  language: 'he' | 'en';
}

type WidgetState = 'hidden' | 'tab' | 'form' | 'success';

const SUBMITTED_KEY  = (id: number) => `pxlead_submitted_${id}`;
const DISMISSED_KEY  = (id: number) => `pxlead_dismissed_${id}`;
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const TRIGGER_DELAY  = 40_000; // 40s
const SCROLL_PCT     = 0.45;   // 45%

function shouldSkip(eventId: number) {
  if (localStorage.getItem(SUBMITTED_KEY(eventId)) === '1') return true;
  const raw = localStorage.getItem(DISMISSED_KEY(eventId));
  if (raw) {
    const ts = parseInt(raw, 10);
    if (!isNaN(ts) && Date.now() - ts < DISMISS_TTL_MS) return true;
    // TTL expired — clean up so it shows again
    localStorage.removeItem(DISMISSED_KEY(eventId));
  }
  return false;
}

export function LeadCaptureWidget({ eventId, language }: LeadCaptureWidgetProps) {
  const isHe = language === 'he';
  const [state, setState] = useState<WidgetState>('hidden');
  const [tabVisible, setTabVisible] = useState(false); // controls slide-in animation
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const triggered = useRef(false);

  const show = () => {
    if (triggered.current || shouldSkip(eventId)) return;
    triggered.current = true;
    setState('tab');
    // Short delay so CSS transition fires
    setTimeout(() => setTabVisible(true), 50);
  };

  useEffect(() => {
    if (shouldSkip(eventId)) return;
    const timer = setTimeout(show, TRIGGER_DELAY);
    const onScroll = () => {
      const pct = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (pct >= SCROLL_PCT) show();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll); };
  }, [eventId]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY(eventId), Date.now().toString());
    setTabVisible(false);
    setTimeout(() => setState('hidden'), 400);
  };

  const openForm = () => setState('form');
  const closeForm = () => setState('tab');

  // Auto-close success card after 3s
  useEffect(() => {
    if (state !== 'success') return;
    const t = setTimeout(() => setState('hidden'), 3000);
    return () => clearTimeout(t);
  }, [state]);

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
      setState('success');
      setTabVisible(false);
    } else {
      setError(isHe ? 'אירעה שגיאה, נסה שוב' : 'Something went wrong, please try again');
    }
  };

  if (state === 'hidden') return null;

  return (
    <>
      {/* ── Floating side tab ────────────────────────────────────────────── */}
      {(state === 'tab' || state === 'form') && (
        <div
          className={`
            fixed top-1/2 -translate-y-1/2 z-50
            transition-all duration-400 ease-out
            ${isHe ? 'left-0' : 'right-0'}
            ${tabVisible ? 'translate-x-0 opacity-100' : (isHe ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0')}
          `}
          style={{ direction: 'ltr' }}
        >
          <div className="relative flex items-center">
            {/* The tab itself */}
            <button
              onClick={openForm}
              className={`
                flex flex-col items-center justify-center gap-1.5
                w-10 py-5 rounded-none shadow-lg
                bg-primary text-primary-foreground
                hover:brightness-105 transition-all
                ${isHe ? 'rounded-r-xl' : 'rounded-l-xl'}
              `}
            >
              <Sparkles className="h-4 w-4 opacity-90" />
              <span
                className="text-[11px] font-semibold tracking-wide leading-none"
                style={{ writingMode: 'vertical-rl', transform: isHe ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                {isHe ? 'צרו קשר' : 'Contact'}
              </span>
            </button>

            {/* Dismiss X */}
            <button
              onClick={dismiss}
              className={`
                absolute -top-2 w-5 h-5 rounded-full
                bg-muted border border-border shadow-sm
                flex items-center justify-center
                text-muted-foreground hover:text-foreground hover:bg-muted/80 transition
                ${isHe ? '-right-2' : '-left-2'}
              `}
              aria-label="dismiss"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Centered form overlay ─────────────────────────────────────────── */}
      {state === 'form' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          dir={isHe ? 'rtl' : 'ltr'}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={closeForm}
          />

          {/* Card */}
          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {isHe ? 'השאר פרטים ונחזור אליך' : 'Leave details and we\'ll be in touch'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isHe ? 'נשמח לשמוע ממך' : 'We\'d love to hear from you'}
                </p>
              </div>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
              {/* Name + Phone row */}
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
                    type="tel" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder={isHe ? 'טלפון *' : 'Phone *'} required
                    dir={phone ? 'ltr' : undefined}
                    className="w-full ps-8 pe-2 py-2.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={isHe ? 'מייל (אופציונלי)' : 'Email (optional)'}
                  className="w-full ps-8 pe-2 py-2.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>

              {/* Note */}
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
      )}

      {/* ── Success overlay ───────────────────────────────────────────────── */}
      {state === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none" dir={isHe ? 'rtl' : 'ltr'}>
          <div className="relative pointer-events-auto bg-background border border-border rounded-2xl shadow-2xl px-8 py-7 flex flex-col items-center gap-3 text-center max-w-xs animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setState('hidden')}
              className="absolute top-3 end-3 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
              aria-label="close"
            >
              <X className="h-4 w-4" />
            </button>
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-semibold text-foreground">
              {isHe ? '🎉 תודה רבה' : '🎉 Thank you'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isHe ? 'נחזור אליך בהקדם' : "We'll be in touch soon"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
