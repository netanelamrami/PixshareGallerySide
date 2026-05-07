import { useState } from 'react';
import { apiService } from '@/data/services/apiService';

// ── Types ────────────────────────────────────────────────────────────────────
type QuestionType = 'FreeText' | 'MultipleChoice' | 'StarRating';
type DisplayMode  = 'AllAtOnce' | 'Wizard';
type Phase        = 'intro' | 'questions';

interface Option   { id: number; text: string; orderIndex: number; }
interface Question { id: number; text: string; type: QuestionType; orderIndex: number; options: Option[]; }

interface Survey {
  id: number;
  isSkippable: boolean;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  displayMode?: DisplayMode;
  questions: Question[];
}

interface Answer {
  questionId: number;
  freeText?: string;
  starRating?: number;
  selectedOptionId?: number;
}

interface SurveyModalProps {
  survey: Survey;
  userId: number;
  language: 'he' | 'en';
  userName?: string;       // empty string = no name
  photoCount?: number | null;
  onDone: () => void;
}

// ── Star Input ───────────────────────────────────────────────────────────────
function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-2 mt-3 justify-center">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="text-4xl leading-none transition-transform hover:scale-110 focus:outline-none"
        >
          <span className={n <= (hover || value) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  );
}

// ── Question body ─────────────────────────────────────────────────────────────
function QuestionBody({ q, answer, onChange, isHe }: {
  q: Question; answer: Answer | undefined;
  onChange: (p: Partial<Answer>) => void; isHe: boolean;
}) {
  return (
    <>
      {q.type === 'StarRating' && (
        <StarInput value={answer?.starRating ?? 0} onChange={n => onChange({ starRating: n })} />
      )}
      {q.type === 'MultipleChoice' && (
        <div className="space-y-2 mt-2">
          {[...q.options].sort((a, b) => a.orderIndex - b.orderIndex).map(opt => {
            const sel = answer?.selectedOptionId === opt.id;
            return (
              <button key={opt.id} type="button" dir="auto"
                onClick={() => onChange({ selectedOptionId: opt.id })}
                className={`w-full text-sm text-start px-4 py-3 rounded-xl border-2 transition-colors
                  ${sel ? 'border-primary bg-primary/10 font-medium' : 'border-border bg-muted/30 hover:border-primary/50'}`}
              >{opt.text}</button>
            );
          })}
        </div>
      )}
      {q.type === 'FreeText' && (
        <textarea rows={3} dir={isHe ? 'rtl' : 'ltr'}
          value={answer?.freeText ?? ''}
          onChange={e => onChange({ freeText: e.target.value })}
          placeholder={isHe ? 'כתוב כאן...' : 'Write here...'}
          className="w-full mt-2 px-3 py-2 text-sm rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SurveyModal({ survey, userId, language, userName = '', photoCount = null, onDone }: SurveyModalProps) {
  const isHe      = language === 'he';
  const dir       = isHe ? 'rtl' : 'ltr';
  const mode      = survey.displayMode ?? 'AllAtOnce';
  const btnLabel  = survey.buttonText ?? (isHe ? 'שלח תשובות' : 'Submit answers');
  const questions = [...survey.questions].sort((a, b) => a.orderIndex - b.orderIndex);

  const [phase, setPhase]       = useState<Phase>('intro');
  const [answers, setAnswers]   = useState<Record<number, Answer>>({});
  const [step, setStep]         = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const setAnswer = (qId: number, patch: Partial<Answer>) =>
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], questionId: qId, ...patch } }));

  const doSubmit = async (skip = false) => {
    setSubmitting(true);
    try {
      await apiService.submitSurveyResponse({
        surveyId: survey.id, userId, isSkipped: skip,
        answers: skip ? [] : Object.values(answers),
      });
    } finally {
      setSubmitting(false);
      onDone();
    }
  };

  // ── INTRO screen ─────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    const greeting = userName
      ? (isHe ? `רגע לפני, ${userName}!` : `Hold up, ${userName}!`)
      : (isHe ? 'רגע לפני!' : 'Almost there!');

    const subheading = isHe ? 'התמונות שלך מחכות לך 📸' : 'Your photos are ready 📸';

    const body = isHe
      ? `כדי לפתוח את הגלרייה האישית שלך, ענה על ${questions.length} שאלות קצרות שיעזרו לנו לשפר אירועים עתידיים.`
      : `To unlock your personal gallery, please answer ${questions.length} quick question${questions.length !== 1 ? 's' : ''} to help improve future events.`;

    const ctaLabel = isHe ? 'התחל סקר ופתח גלרייה 🔓' : 'Take Quick Survey & Unlock 🔓';

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" dir={dir}>
        <div className="bg-background w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

          {/* Top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          <div className="px-6 pt-8 pb-7 flex flex-col items-center text-center gap-5">

            {/* Drag handle (mobile) */}
            <div className="w-10 h-1 bg-muted rounded-full sm:hidden -mt-4" />

            {/* Lock icon */}
            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-inner">
              <span className="text-5xl select-none">🔒</span>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                {greeting}
              </h2>
              <p className="text-base font-semibold text-foreground">
                {subheading}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {body}
              </p>
            </div>

            {/* Time badge */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5">
              <span>✨</span>
              <span>{isHe ? 'לוקח פחות מ-30 שניות' : 'Takes less than 30 seconds'}</span>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={() => setPhase('questions')}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {ctaLabel}
            </button>

            {/* Photo count */}
            {photoCount !== null && photoCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {isHe
                  ? <>מצאנו <span className="font-bold text-foreground">{photoCount}</span> תמונות שלך שמחכות מאחורי השער</>
                  : <>We found <span className="font-bold text-foreground">{photoCount}</span> photo{photoCount !== 1 ? 's' : ''} of you waiting behind this gate</>
                }
              </p>
            )}

            {/* Skip (only if skippable) */}
            {survey.isSkippable && (
              <button
                type="button"
                onClick={() => doSubmit(true)}
                disabled={submitting}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground underline underline-offset-2 transition-colors"
              >
                {isHe ? 'דלג על הסקר' : 'Skip survey'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── WIZARD mode ───────────────────────────────────────────────────────────────
  if (mode === 'Wizard') {
    const q      = questions[step];
    const isLast = step === questions.length - 1;
    const pct    = ((step + 1) / questions.length) * 100;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" dir={dir}>
        <div className="bg-background w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }}>

          {/* Progress bar */}
          <div className="h-1 bg-muted w-full">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>

          {/* Header */}
          <div className="px-5 pt-5 pb-3 shrink-0">
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold">{survey.title ?? (isHe ? 'שאלון קצר 📋' : 'Quick Survey 📋')}</h2>
              <span className="text-xs text-muted-foreground font-mono" dir="ltr">{step + 1} / {questions.length}</span>
            </div>
          </div>

          {/* Question */}
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <p className="text-sm font-semibold text-foreground mb-3" dir="auto">{q.text}</p>
            <QuestionBody q={q} answer={answers[q.id]} onChange={p => setAnswer(q.id, p)} isHe={isHe} />
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t shrink-0 space-y-2">
            <div className="flex gap-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="h-12 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  {isHe ? '→' : '←'}
                </button>
              )}
              <button type="button" onClick={() => isLast ? doSubmit(false) : setStep(s => s + 1)}
                disabled={submitting}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {submitting ? (isHe ? 'שולח...' : 'Sending...')
                  : isLast ? btnLabel
                  : (isHe ? 'הבא' : 'Next')}
              </button>
            </div>
            {survey.isSkippable && (
              <button type="button" onClick={() => doSubmit(true)} disabled={submitting}
                className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-60"
              >
                {isHe ? 'דלג על הסקר' : 'Skip survey'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── ALL-AT-ONCE mode ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" dir={dir}>
      <div className="bg-background w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b shrink-0">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4 sm:hidden" />
          <h2 className="text-lg font-bold text-center">
            {survey.title ?? (isHe ? 'שאלון קצר 📋' : 'Quick Survey 📋')}
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {survey.subtitle ?? (isHe ? 'נשמח לשמוע את דעתך' : "We'd love your feedback")}
          </p>
        </div>

        {/* Questions */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id}>
              <p className="text-sm font-semibold text-foreground mb-1" dir="auto">
                <span className="text-primary font-bold">{idx + 1}. </span>{q.text}
              </p>
              <QuestionBody q={q} answer={answers[q.id]} onChange={p => setAnswer(q.id, p)} isHe={isHe} />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t shrink-0 flex flex-col gap-2">
          <button type="button" onClick={() => doSubmit(false)} disabled={submitting}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {submitting ? (isHe ? 'שולח...' : 'Sending...') : btnLabel}
          </button>
          {survey.isSkippable && (
            <button type="button" onClick={() => doSubmit(true)} disabled={submitting}
              className="w-full h-10 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-60"
            >
              {isHe ? 'דלג על הסקר' : 'Skip survey'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
