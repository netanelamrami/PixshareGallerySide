import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Phone, RefreshCw } from 'lucide-react';
import { apiService } from '@/data/services/apiService';

interface GalleryPaymentModalProps {
  eventId: number;
  phoneNumber: string;
  paymentLink: string;
  language: 'he' | 'en';
  onSuccess: () => void;
  onCancel: () => void;
}

type Phase = 'warning' | 'iframe' | 'success' | 'contact';

const POLL_INTERVAL_MS = 5000;
// 10 min — user needs time to fill the form; timeout only fires if webhook never arrives after payment
const POLL_TIMEOUT_MS  = 10 * 60 * 1000;

export function GalleryPaymentModal({
  eventId,
  phoneNumber,
  paymentLink,
  language,
  onSuccess,
  onCancel,
}: GalleryPaymentModalProps) {
  const isHe = language === 'he';
  const [phase, setPhase] = useState<Phase>('warning');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pollingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => stopPolling(), []);

  const stopPolling = () => {
    if (pollingTimer.current) { clearInterval(pollingTimer.current); pollingTimer.current = null; }
    if (timeoutTimer.current) { clearTimeout(timeoutTimer.current);  timeoutTimer.current = null; }
  };

  const phaseRef = useRef<Phase>('warning');
  // Keep phaseRef in sync so the timeout callback sees the current phase
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const startPolling = () => {
    pollingTimer.current = setInterval(async () => {
      const result = await apiService.verifyGalleryPayment(phoneNumber, eventId);
      if (result.isPaid) {
        stopPolling();
        // Show success briefly, then auto-advance after 1.5s
        setPhase('success');
        setTimeout(() => onSuccess(), 1500);
      }
    }, POLL_INTERVAL_MS);

    timeoutTimer.current = setTimeout(() => {
      stopPolling();
      if (phaseRef.current === 'iframe') setPhase('contact');
    }, POLL_TIMEOUT_MS);
  };

  const handleGoToPayment = () => {
    setPhase('iframe');
    setIframeLoaded(false);
    startPolling();
  };

  const handleRefreshIframe = () => {
    setIsRefreshing(true);
    setIframeLoaded(false);
    setIframeKey(k => k + 1);
  };

  const handleSuccessClose = () => {
    onSuccess();
  };

  // ── Warning phase ──
  if (phase === 'warning') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir={isHe ? 'rtl' : 'ltr'}>
        <div className="bg-background rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">{isHe ? 'גלרייה בתשלום' : 'Paid Gallery'}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isHe ? 'גלרייה זו מצריכה תשלום חד-פעמי לכניסה' : 'This gallery requires a one-time payment to access'}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Phone warning */}
            <div className="flex gap-3 p-4 border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  {isHe ? 'שים לב' : 'Important!'}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {isHe
                    ? 'בטופס התשלום חייב להזין את מספר הטלפון שנרשמת איתו לגלרייה. אם תזין מספר אחר  התשלום לא יזוהה ולא תוכל להיכנס.'
                    : 'In the payment form, you must enter the same phone number you used to register for the gallery. Using a different number will prevent access.'}
                </p>
                <div className="flex items-center gap-2 mt-2 p-2 bg-amber-100 dark:bg-amber-900/40 rounded">
                  <Phone className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span className="font-mono text-sm font-bold text-amber-800 dark:text-amber-300" dir="ltr">
                    {phoneNumber}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleGoToPayment}
              className="w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors"
            >
              {isHe ? 'הבנתי, עבור לתשלום' : 'Understood, go to payment'}
            </button>
            <button
              onClick={onCancel}
              className="w-full h-10 rounded-md border border-input bg-background text-sm hover:bg-muted transition-colors"
            >
              {isHe ? 'ביטול' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success phase ──
  if (phase === 'success') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir={isHe ? 'rtl' : 'ltr'}>
        <div className="bg-background rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {isHe ? 'התשלום אושר!' : 'Payment confirmed!'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isHe ? 'כעת ניתן להיכנס לגלרייה' : 'You can now access the gallery'}
          </p>
          <button
            onClick={handleSuccessClose}
            className="w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            {isHe ? 'המשך' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  // ── Contact phase (timeout) ──
  if (phase === 'contact') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir={isHe ? 'rtl' : 'ltr'}>
        <div className="bg-background rounded-xl shadow-2xl w-full max-w-md p-8 text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">
            {isHe ? 'לא זיהינו את התשלום' : 'Payment not detected'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isHe
              ? 'ייתכן שהוזן מספר טלפון שונה בטופס התשלום. קיבלנו התראה ונחזור אליך בהקדם.'
              : 'The payment may have been made with a different phone number. We received an alert and will contact you shortly.'}
          </p>
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">{isHe ? 'שעות פעילות: 09:00–18:00' : 'Business hours: 09:00–18:00'}</p>
            <button
              className="text-primary underline mt-1 text-sm"
              onClick={() => window.open('https://wa.me/972542349169', '_blank')}
            >
              {isHe ? 'פנה אלינו בוואטסאפ' : 'Contact us on WhatsApp'}
            </button>
          </div>
          <button
            onClick={onCancel}
            className="w-full h-10 rounded-md border border-input bg-background text-sm hover:bg-muted transition-colors"
          >
            {isHe ? 'סגור' : 'Close'}
          </button>
        </div>
      </div>
    );
  }

  // ── iframe phase ──
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2" dir={isHe ? 'rtl' : 'ltr'}>
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ height: '90vh' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 rounded-t-xl">
          <div>
            <p className="text-sm font-semibold">{isHe ? 'תשלום לגלרייה' : 'Gallery Payment'}</p>
            <p className="text-xs text-muted-foreground">{isHe ? 'ממתין לאישור תשלום...' : 'Waiting for payment confirmation...'}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Refresh button */}
            <button
              onClick={handleRefreshIframe}
              disabled={!iframeLoaded}
              title={isHe ? 'רענן את טופס התשלום' : 'Refresh payment form'}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isHe ? 'רענון' : 'Refresh'}
            </button>
            {/* Polling indicator */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isHe ? 'בודק אוטומטית' : 'Auto-checking'}
            </div>
          </div>
        </div>

        {/* Phone reminder strip */}
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 text-amber-800 dark:text-amber-300 text-xs">
          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            {isHe ? 'זכור: השתמש במספר ' : 'Remember: use number '}
            <strong className="font-mono" dir="ltr">{phoneNumber}</strong>
            {isHe ? ' בטופס התשלום' : ' in the payment form'}
          </span>
        </div>

        {/* iframe */}
        <div className="flex-1 relative rounded-b-xl overflow-hidden">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}
          <iframe
            key={iframeKey}
            src={paymentLink}
            className="w-full h-full border-0"
            onLoad={() => { setIframeLoaded(true); setIsRefreshing(false); }}
            title="Gallery Payment"
            allow="payment"
          />
        </div>
      </div>
    </div>
  );
}
