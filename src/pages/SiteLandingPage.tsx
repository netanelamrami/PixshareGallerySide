import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiService } from "@/data/services/apiService";
import { SelfieCapture } from "@/components/auth/SelfieCapture";
import { useLanguage } from "@/hooks/useLanguage";
import {
  CalendarDays, ChevronRight, ChevronLeft,
  ImageIcon, Loader2, Mail, Phone, LayoutGrid, User, LogOut,
} from "lucide-react";
import countries from "@/types/contries";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SiteData {
  id: number;
  name: string;
  slug: string;
  backgroundImageUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  welcomeTitleHe?: string;
  welcomeTitleEn?: string;
  welcomeSubtitleHe?: string;
  welcomeSubtitleEn?: string;
  isActive: boolean;
  events: SiteEventData[];
}

interface SiteEventData {
  eventId: number;
  eventName: string;
  eventDate?: string;
  coverImageUrl?: string;
  orderBy: number;
  totalPhotos: number;
}

interface SiteStats {
  totalEvents: number;
  totalUsers: number;
  totalPhotos: number;
  userEventsWithPhotos?: number;
  userTotalPhotos?: number;
  userEventIds?: number[];
  /** eventId → per-event userId — use this when navigating into an event */
  userEventMap?: Record<number, number>;
}

interface LoggedInUser {
  userId: number;
  name?: string;
  photoUrl?: string;
}

type Phase =
  | "loading"
  | "landing"
  | "contact-form"
  | "otp-sending"
  | "otp-input"
  | "checking"
  | "selfie"
  | "registering"
  | "events"
  | "not-found";

type ContactType = "phone" | "email";

// ── Session helpers ───────────────────────────────────────────────────────────

const SESSION_KEY = "site_user";

function saveSession(user: LoggedInUser, siteId: number) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...user, siteId }));
}

function loadSession(siteId: number): LoggedInUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.siteId !== siteId) return null;
    return { userId: parsed.userId, name: parsed.name, photoUrl: parsed.photoUrl };
  } catch {
    return null;
  }
}

// ── Image compression helper ──────────────────────────────────────────────────

function compressBase64Image(base64: string, maxPx = 640, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = base64;
  });
}

// ── Sub-components defined OUTSIDE to avoid remount on re-render ──────────────

interface PrimaryBtnProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
  primaryColor: string;
  style?: React.CSSProperties;
}

const PrimaryBtn: React.FC<PrimaryBtnProps> = ({
  onClick, disabled = false, children, fullWidth = true, primaryColor, style = {},
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? "#555" : primaryColor,
      color: "#fff",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      ...(fullWidth ? { width: "100%" } : {}),
      padding: "12px 20px",
      borderRadius: 12,
      fontWeight: 600,
      fontSize: 15,
      border: "none",
      transition: "opacity 0.15s",
      ...style,
    }}
  >
    {children}
  </button>
);

interface GhostBtnProps {
  onClick?: () => void;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const GhostBtn: React.FC<GhostBtnProps> = ({ onClick, children, fullWidth = false }) => (
  <button
    onClick={onClick}
    style={{
      background: "rgba(255,255,255,0.08)",
      color: "#fff",
      cursor: "pointer",
      border: "1px solid rgba(255,255,255,0.25)",
      ...(fullWidth ? { width: "100%" } : {}),
      padding: "11px 18px",
      borderRadius: 12,
      fontWeight: 500,
      fontSize: 15,
      transition: "background 0.15s",
    }}
  >
    {children}
  </button>
);

const FormCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
    <div
      className="w-full max-w-sm rounded-2xl shadow-2xl"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.10)" }}
    >
      {children}
    </div>
  </div>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
};

// ── Logout confirm overlay (module-level to avoid remount) ────────────────────

interface LogoutConfirmProps {
  isHe: boolean;
  primaryColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutConfirm: React.FC<LogoutConfirmProps> = ({ isHe, primaryColor, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
  >
    <div
      className="w-full max-w-xs mx-4 rounded-2xl p-6 space-y-4 text-center"
      style={{ background: "rgba(20,20,20,0.97)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <LogOut style={{ width: 36, height: 36, color: "rgba(255,255,255,0.7)", margin: "0 auto" }} />
      <p className="text-white font-semibold text-lg">
        {isHe ? "להתנתק?" : "Sign out?"}
      </p>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
        {isHe ? "תצטרכו להזדהות מחדש בכניסה הבאה" : "You'll need to verify again next time"}
      </p>
      <div className="flex gap-3 pt-1">
        <GhostBtn onClick={onCancel} fullWidth>{isHe ? "ביטול" : "Cancel"}</GhostBtn>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
            background: "#ef4444", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer",
          }}
        >
          {isHe ? "התנתק" : "Sign out"}
        </button>
      </div>
    </div>
  </div>
);

// ── Country code selector for phone (styled for dark overlay) ────────────────

interface PhoneWithPrefixProps {
  value: string;
  onChange: (val: string) => void;
  countryCode: string;
  onCountryChange: (code: string) => void;
  onEnter: () => void;
  isHe: boolean;
}

const PhoneWithPrefix: React.FC<PhoneWithPrefixProps> = ({
  value, onChange, countryCode, onCountryChange, onEnter, isHe,
}) => {
  const [open, setOpen] = useState(false);
  const selected = countries.find(c => c.code === countryCode) ?? countries[0];

  return (
    <div style={{ position: "relative" }}>
      <div className="flex gap-2" dir="ltr">
        {/* Country picker button */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            ...inputStyle,
            width: "auto",
            padding: "12px 10px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 18 }}>{selected.flag}</span>
          <span style={{ fontSize: 13 }}>{selected.code}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>▾</span>
        </button>

        {/* Phone number input */}
        <input
          type="tel"
          dir="ltr"
          placeholder={isHe ? "מספר טלפון" : "Phone number"}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && value.trim() && onEnter()}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 100,
            marginTop: 4,
            width: 230,
            maxHeight: 220,
            overflowY: "auto",
            background: "rgba(15,15,15,0.97)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          {countries.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => { onCountryChange(c.code); setOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "9px 12px", background: c.code === countryCode ? "rgba(255,255,255,0.08)" : "transparent",
                border: "none", color: "#fff", cursor: "pointer", fontSize: 14, textAlign: "left",
              }}
            >
              <span style={{ fontSize: 18 }}>{c.flag}</span>
              <span style={{ opacity: 0.6, fontSize: 12 }}>{c.code}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{isHe ? c.name.he : c.name.en}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const SiteLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isHe = language === "he";

  // Photographer preview mode — ?previewUserId=X → auto-login as that user
  const previewUserId = searchParams.get("previewUserId");

  const [phase, setPhase] = useState<Phase>("loading");
  const [site, setSite] = useState<SiteData | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Contact form
  const [contactType, setContactType] = useState<ContactType>("phone");
  const [contactValue, setContactValue] = useState("");
  const [countryCode, setCountryCode] = useState("+972");

  // OTP (4 separate chars to avoid input re-render focus issues)
  const otpRef0 = useRef<HTMLInputElement>(null);
  const otpRef1 = useRef<HTMLInputElement>(null);
  const otpRef2 = useRef<HTMLInputElement>(null);
  const otpRef3 = useRef<HTMLInputElement>(null);
  const otpRefs = [otpRef0, otpRef1, otpRef2, otpRef3];
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);

  // Selfie / register
  const [fullName, setFullName] = useState("");

  const primaryColor = site?.primaryColor || "#6366f1";

  // Full phone number with country code
  const fullPhone = () => {
    const clean = contactValue.replace(/^0/, "").replace(/[\s\-]/g, "");
    return countryCode + clean;
  };

  // Contact value sent to API (phone includes prefix, email as-is)
  const resolvedContact = () =>
    contactType === "phone" ? fullPhone() : contactValue.trim();

  // ── Load site ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!slug) { setPhase("not-found"); return; }
    apiService.getSiteBySlug(slug).then(async (data) => {
      if (!data || !data.isActive) { setPhase("not-found"); return; }
      setSite(data);

      // ── Photographer preview mode ───────────────────────────────────────────
      // When ?previewUserId=X is in the URL, skip the login flow entirely and
      // auto-login as that user so the photographer sees exactly what they see.
      if (previewUserId) {
        const uid = parseInt(previewUserId, 10);
        if (!isNaN(uid)) {
          try {
            const userInfo = await apiService.getSiteUserInfo(data.id, uid);
            if (userInfo && userInfo.userId) {
              const user: LoggedInUser = {
                userId: userInfo.userId,
                name: userInfo.name,
                photoUrl: userInfo.photoUrl,
              };
              setLoggedInUser(user);
              await loadStats(data.id, uid);
              setPhase("events");
              return; // skip normal session/login flow
            }
          } catch { /* fall through to normal flow */ }
        }
      }

      // ── Normal flow ─────────────────────────────────────────────────────────
      const session = loadSession(data.id);
      if (session) {
        setLoggedInUser(session);
        loadStats(data.id, session.userId);
        setPhase("events");
      } else {
        setPhase("landing");
      }
    });
  }, [slug, previewUserId]);

  // ── CSS variables ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!site) return;
    const root = document.documentElement;
    if (site.primaryColor)   root.style.setProperty("--site-primary",   site.primaryColor);
    if (site.secondaryColor) root.style.setProperty("--site-secondary", site.secondaryColor);
    return () => {
      root.style.removeProperty("--site-primary");
      root.style.removeProperty("--site-secondary");
    };
  }, [site]);

  const loadStats = useCallback(async (siteId: number, userId?: number) => {
    try {
      const s = await apiService.getSiteStats(siteId, userId);
      setStats(s);
    } catch { /* silent */ }
  }, []);

  // ── Auth ────────────────────────────────────────────────────────────────────

  const handleSendOtp = async () => {
    const val = resolvedContact();
    if (!val || !site) return;
    setError(null);
    setPhase("otp-sending");
    setOtpDigits(["", "", "", ""]);
    try {
      if (contactType === "phone") await apiService.siteSendOtpPhone(val);
      else await apiService.siteSendOtpEmail(val);
      setPhase("otp-input");
      setTimeout(() => otpRefs[0].current?.focus(), 150);
    } catch {
      setError(isHe ? "שגיאה בשליחת קוד" : "Failed to send code");
      setPhase("contact-form");
    }
  };

  const verifyAndContinue = async (code: string) => {
    if (code.length < 4 || !site) return;
    setError(null);
    setPhase("checking");

    const contact = resolvedContact();
    const otpResult = await apiService.siteVerifyOtp(contact, code);
    if (!otpResult.verified) {
      setError(isHe ? "הקוד שגוי, נסה שוב" : "Incorrect code, please try again");
      setOtpDigits(["", "", "", ""]);
      setPhase("otp-input");
      setTimeout(() => otpRefs[0].current?.focus(), 150);
      return;
    }

    const loginContact = contactType === "email"
      ? { email: contactValue.trim() }
      : { phoneNumber: fullPhone() };
    const loginResult = await apiService.siteLoginByContact(site.id, loginContact);

    if (loginResult.success && loginResult.userId) {
      const user: LoggedInUser = { userId: loginResult.userId, name: loginResult.name, photoUrl: loginResult.photoUrl };
      setLoggedInUser(user);
      saveSession(user, site.id);
      await loadStats(site.id, loginResult.userId);
      setPhase("events");
    } else {
      setPhase("selfie");
    }
  };

  const handleOtpDigitChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[idx] = digit;
    setOtpDigits(next);
    if (digit && idx < 3) otpRefs[idx + 1].current?.focus();
    if (next.every(d => d !== "")) {
      const code = next.join("");
      setTimeout(() => verifyAndContinue(code), 100);
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      const next = [...otpDigits];
      next[idx - 1] = "";
      setOtpDigits(next);
      otpRefs[idx - 1].current?.focus();
    }
  };

  const handleSelfieCapture = async (imageData: string) => {
    if (!site) return;
    setError(null);
    setPhase("registering");
    try {
      // Compress before sending to reduce payload
      const compressed = await compressBase64Image(imageData, 640, 0.75);

      const result = await apiService.siteRegister(site.id, compressed, {
        fullName:        fullName.trim() || undefined,
        phoneNumber:     contactType === "phone" ? fullPhone() : undefined,
        email:           contactType === "email"  ? contactValue.trim() : undefined,
        authenticateBy:  contactType === "email" ? "Email" : "PhoneNumber",
        sendNotification: true,
      });
      if (result.success && result.userId) {
        const user: LoggedInUser = { userId: result.userId, name: result.name, photoUrl: result.photoUrl };
        setLoggedInUser(user);
        saveSession(user, site.id);
        await loadStats(site.id, result.userId);
        setPhase("events");
      } else {
        setError(isHe ? "הרשמה נכשלה, אנא נסה שוב" : "Registration failed");
        setPhase("selfie");
      }
    } catch {
      setError(isHe ? "שגיאה, אנא נסה שוב" : "An error occurred");
      setPhase("selfie");
    }
  };

  const handleEventClick = (event: SiteEventData) => {
    if (!loggedInUser) return;
    // Use the per-event userId for this specific event (not the master userId)
    const perEventUserId = stats?.userEventMap?.[event.eventId] ?? loggedInUser.userId;
    sessionStorage.setItem("siteUserId", String(perEventUserId));
    window.open(
      `/site-event/${event.eventId}?userid=${perEventUserId}`,
      "_blank"
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setLoggedInUser(null); setStats(null); setContactValue(""); setFullName("");
    setOtpDigits(["", "", "", ""]); setError(null); setShowMyEventsOnly(false);
    setShowLogoutConfirm(false);
    setPhase("landing");
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const welcomeTitle = isHe
    ? (site?.welcomeTitleHe || site?.name || "הגלריה שלי")
    : (site?.welcomeTitleEn || site?.name || "My Gallery");
  const welcomeSubtitle = isHe ? (site?.welcomeSubtitleHe || "") : (site?.welcomeSubtitleEn || "");
  const userEventIds = stats?.userEventIds ?? [];
  const visibleEvents = showMyEventsOnly
    ? (site?.events ?? []).filter(e => userEventIds.includes(e.eventId))
    : (site?.events ?? []);

  // ── Full-screen states ───────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (phase === "not-found") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">{isHe ? "הגלריה לא נמצאה" : "Gallery not found"}</h1>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>
          {isHe ? "הקישור אינו תקין או שהגלריה אינה פעילה" : "The link is invalid or the gallery is inactive"}
        </p>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col"
      dir={isHe ? "rtl" : "ltr"}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Logout confirmation overlay */}
      {showLogoutConfirm && (
        <LogoutConfirm
          isHe={isHe}
          primaryColor={primaryColor}
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {/* Background */}
      <div className="fixed inset-0 z-0">
        {site?.backgroundImageUrl ? (
          <img src={site.backgroundImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${primaryColor}33 0%, #0a0a0a 100%)` }} />
        )}
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.60)" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Header — same width as events grid */}
        <header className="w-full max-w-5xl mx-auto flex items-center justify-between px-6 pt-5 pb-2">
          {site?.logoUrl
            ? <img src={site.logoUrl} alt={site.name} className="h-10 object-contain" />
            : <span className="text-white font-bold text-lg">{site?.name}</span>
          }
          {loggedInUser && (
            <div className="flex items-center gap-2">
              {loggedInUser.photoUrl && (
                <img
                  src={loggedInUser.photoUrl}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover object-top flex-shrink-0"
                  style={{ border: "2px solid rgba(255,255,255,0.3)" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                title={isHe ? "התנתק" : "Sign out"}
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.75)",
                  cursor: "pointer",
                  borderRadius: 8,
                  padding: "6px 8px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <LogOut style={{ width: 16, height: 16 }} />
              </button>
            </div>
          )}
        </header>

        {/* ════ LANDING ════ */}
        {phase === "landing" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
            <div className="space-y-3 max-w-lg">
              <h1 className="text-white text-4xl sm:text-5xl font-bold leading-tight drop-shadow-lg">{welcomeTitle}</h1>
              {welcomeSubtitle && (
                <p style={{ color: "rgba(255,255,255,0.70)" }} className="text-lg">{welcomeSubtitle}</p>
              )}
            </div>
            <button
              onClick={() => setPhase("contact-form")}
              style={{ background: primaryColor, color: "#fff", border: "none", cursor: "pointer" }}
              className="px-10 py-4 rounded-full text-lg font-semibold shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              {isHe ? "כנסו לגלריה שלי ←" : "Enter My Gallery →"}
            </button>
          </div>
        )}

        {/* ════ CONTACT FORM ════ */}
        {phase === "contact-form" && (
          <FormCard>
            <div className="p-6 space-y-5">
              <div className="text-center">
                <h2 className="text-white text-xl font-bold">{isHe ? "כניסה לגלריה" : "Enter the Gallery"}</h2>
                <p style={{ color: "rgba(255,255,255,0.50)", fontSize: 13, marginTop: 4 }}>
                  {isHe ? "הכניסו מספר טלפון או מייל לאימות" : "Enter your phone or email to verify"}
                </p>
              </div>

              {/* Phone / Email toggle */}
              <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
                {(["phone", "email"] as ContactType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setContactType(t); setContactValue(""); setError(null); }}
                    style={{
                      flex: 1, padding: "10px 0",
                      background: contactType === t ? primaryColor : "transparent",
                      color: "#fff", border: "none", cursor: "pointer",
                      fontWeight: contactType === t ? 700 : 400,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 6, fontSize: 14, transition: "background 0.18s",
                    }}
                  >
                    {t === "phone"
                      ? <><Phone style={{ width: 14, height: 14 }} />{isHe ? "טלפון" : "Phone"}</>
                      : <><Mail style={{ width: 14, height: 14 }} />{isHe ? "מייל" : "Email"}</>
                    }
                  </button>
                ))}
              </div>

              {/* Phone with country prefix / Email input */}
              {contactType === "phone" ? (
                <PhoneWithPrefix
                  value={contactValue}
                  onChange={v => { setContactValue(v); setError(null); }}
                  countryCode={countryCode}
                  onCountryChange={setCountryCode}
                  onEnter={handleSendOtp}
                  isHe={isHe}
                />
              ) : (
                <input
                  type="email"
                  dir="ltr"
                  placeholder={isHe ? "כתובת מייל" : "Email address"}
                  value={contactValue}
                  onChange={e => { setContactValue(e.target.value); setError(null); }}
                  onKeyDown={e => e.key === "Enter" && contactValue.trim() && handleSendOtp()}
                  style={inputStyle}
                />
              )}

              {error && <p style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>{error}</p>}

              <div className="flex gap-3">
                <GhostBtn onClick={() => setPhase("landing")}>{isHe ? "חזור" : "Back"}</GhostBtn>
                <PrimaryBtn
                  onClick={handleSendOtp}
                  disabled={!contactValue.trim()}
                  primaryColor={primaryColor}
                >
                  {isHe ? "שלח קוד" : "Send Code"}
                </PrimaryBtn>
              </div>
            </div>
          </FormCard>
        )}

        {/* ════ OTP SENDING / CHECKING (loaders) ════ */}
        {(phase === "otp-sending" || phase === "checking") && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: primaryColor }} />
            <p className="text-white text-lg">
              {phase === "otp-sending"
                ? (isHe ? "שולח קוד..." : "Sending code...")
                : (isHe ? "מאמת..." : "Verifying...")}
            </p>
          </div>
        )}

        {/* ════ OTP INPUT ════ */}
        {phase === "otp-input" && (
          <FormCard>
            <div className="p-6 space-y-5">
              <div className="text-center">
                <h2 className="text-white text-xl font-bold">{isHe ? "הזינו קוד אימות" : "Enter Verification Code"}</h2>
                <p style={{ color: "rgba(255,255,255,0.50)", fontSize: 13, marginTop: 4 }}>
                  {isHe ? `שלחנו קוד ל ${resolvedContact()}` : `We sent a code to ${resolvedContact()}`}
                </p>
              </div>

              {/* 4-digit boxes */}
              <div className="flex gap-3 justify-center" dir="ltr">
                {otpDigits.map((d, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    style={{
                      width: 56, height: 64,
                      textAlign: "center", fontSize: 28, fontWeight: 700,
                      borderRadius: 12,
                      border: d ? `2px solid ${primaryColor}` : "2px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff", outline: "none", transition: "border 0.15s",
                    }}
                  />
                ))}
              </div>

              {error && <p style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>{error}</p>}

              <PrimaryBtn
                onClick={() => verifyAndContinue(otpDigits.join(""))}
                disabled={otpDigits.some(d => !d)}
                primaryColor={primaryColor}
              >
                {isHe ? "אמת קוד" : "Verify Code"}
              </PrimaryBtn>

              <button
                onClick={() => { setError(null); setPhase("contact-form"); }}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", width: "100%", fontSize: 13 }}
              >
                {isHe ? "שלח קוד חדש" : "Resend code"}
              </button>
            </div>
          </FormCard>
        )}

        {/* ════ REGISTERING loader ════ */}
        {phase === "registering" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: primaryColor }} />
            <p className="text-white text-lg">{isHe ? "נרשם לגלריה..." : "Registering..."}</p>
          </div>
        )}

        {/* ════ SELFIE (new user) ════ */}
        {phase === "selfie" && (
          <FormCard>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h2 className="text-white text-xl font-bold">{isHe ? "כמעט שם! 🎉" : "Almost there! 🎉"}</h2>
                <p style={{ color: "rgba(255,255,255,0.50)", fontSize: 13, marginTop: 4 }}>
                  {isHe ? "צלמו סלפי ואנחנו נמצא את כל התמונות שלכם" : "Take a selfie and we'll find all your photos"}
                </p>
              </div>
              <input
                type="text"
                placeholder={isHe ? "שם מלא (אופציונלי)" : "Full name (optional)"}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={inputStyle}
              />
              {error && <p style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>{error}</p>}
              <SelfieCapture
                onCapture={handleSelfieCapture}
                onBack={() => { setError(null); setPhase("contact-form"); }}
                withBTAction={true}
                autoOpenCamera={false}
              />
            </div>
          </FormCard>
        )}

        {/* ════ EVENTS ════ */}
        {phase === "events" && site && loggedInUser && (
          <div className="flex-1 flex flex-col">
            <div className="w-full max-w-5xl mx-auto flex flex-col flex-1 px-6 pb-8">

              {/* Stats bar */}
              <div className="pt-4 pb-3">
                <div className="rounded-2xl px-5 py-4 flex items-center gap-4"
                  style={{ background: `${primaryColor}22`, border: `1px solid ${primaryColor}44` }}>
                  {loggedInUser.photoUrl ? (
                    <img
                      src={loggedInUser.photoUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover object-top flex-shrink-0"
                      style={{ border: `2px solid ${primaryColor}` }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${primaryColor}44` }}>
                      <User style={{ width: 22, height: 22, color: "#fff" }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                      {isHe ? `היי ${loggedInUser.name || ""}! 👋` : `Hi ${loggedInUser.name || ""}! 👋`}
                    </p>
                    <div className="flex gap-3 mt-0.5 flex-wrap">
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                        📸 {stats?.userTotalPhotos ?? 0} {isHe ? "תמונות שלך" : "your photos"}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                        🎞️ {stats?.userEventsWithPhotos ?? 0} {isHe ? "אירועים" : "events"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* All / My events toggle */}
              <div className="pb-3">
                <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.12)", maxWidth: 320 }}>
                  {[false, true].map((myOnly) => (
                    <button
                      key={String(myOnly)}
                      onClick={() => setShowMyEventsOnly(myOnly)}
                      style={{
                        flex: 1, padding: "9px 0",
                        background: showMyEventsOnly === myOnly ? primaryColor : "transparent",
                        color: "#fff", border: "none", cursor: "pointer",
                        fontWeight: showMyEventsOnly === myOnly ? 700 : 400,
                        fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 5, transition: "background 0.18s",
                      }}
                    >
                      {myOnly
                        ? <><User style={{ width: 13, height: 13 }} />{isHe ? "האירועים שלי" : "My Events"}</>
                        : <><LayoutGrid style={{ width: 13, height: 13 }} />{isHe ? "כל האירועים" : "All Events"}</>
                      }
                    </button>
                  ))}
                </div>
              </div>

              {/* Events grid */}
              {visibleEvents.length === 0 ? (
                <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>{isHe ? "אין תמונות שלך באירועים עדיין" : "No photos of you yet"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleEvents.map((ev) => {
                    const hasUserPhotos = userEventIds.includes(ev.eventId);
                    return (
                      <button
                        key={ev.eventId}
                        onClick={() => handleEventClick(ev)}
                        className="group relative rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          minHeight: 160,
                          background: "rgba(0,0,0,0.4)",
                          border: hasUserPhotos ? `1.5px solid ${primaryColor}88` : "1px solid rgba(255,255,255,0.1)",
                          cursor: "pointer", textAlign: "start",
                        }}
                      >
                        {ev.coverImageUrl ? (
                          <img src={ev.coverImageUrl} alt={ev.eventName}
                            className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-70 transition-opacity" />
                        ) : (
                          <div className="absolute inset-0 opacity-20"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, transparent)` }} />
                        )}
                        <div className="absolute inset-0"
                          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)" }} />

                        {hasUserPhotos && (
                          <div className="absolute top-3 start-3 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: primaryColor }}>
                            <ImageIcon style={{ width: 11, height: 11 }} />
                            {isHe ? "שם" : "In"}
                          </div>
                        )}

                        <div className="relative p-4 flex flex-col justify-end h-full min-h-[160px]">
                          <div className="mt-auto">
                            <h3 className="text-white font-bold text-lg leading-tight">{ev.eventName}</h3>
                            <div className="flex items-center gap-3 mt-1" style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                              {ev.eventDate && (
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="w-3.5 h-3.5" />{ev.eventDate}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <ImageIcon className="w-3.5 h-3.5" />{ev.totalPhotos}
                              </span>
                            </div>
                          </div>
                          <div className="absolute top-3 end-3">
                            {isHe
                              ? <ChevronLeft className="w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
                              : <ChevronRight className="w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
                            }
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SiteLandingPage;
