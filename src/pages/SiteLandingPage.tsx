import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { apiService } from "@/data/services/apiService";
import { SelfieCapture } from "@/components/auth/SelfieCapture";
import { useLanguage } from "@/hooks/useLanguage";

// Helper: is a hex color "light" (luminance > 0.5)?
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // Relative luminance (simplified)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}
import {
  CalendarDays, ChevronRight, ChevronLeft,
  ImageIcon, Loader2, Mail, LayoutGrid, User, LogOut,
  ShieldOff, CheckCircle2, Search, Download,
} from "lucide-react";

declare const google: any;

// ── Branding panel (defined OUTSIDE main component to prevent remount on every render) ──

interface BrandingPanelProps {
  backgroundImageUrl?: string;
  logoUrl?: string;
  siteName?: string;
  primaryColor: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
}

const BrandingPanel: React.FC<BrandingPanelProps> = ({
  backgroundImageUrl, logoUrl, siteName, primaryColor, welcomeTitle, welcomeSubtitle,
}) => {
  const isLight = !backgroundImageUrl && isLightColor(primaryColor);
  const titleColor = isLight ? "#1a1a2e" : "#ffffff";
  const subtitleColor = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.70)";
  const brandingColor = isLight ? "rgba(0,0,0,0.38)" : "rgba(255,255,255,0.60)";

  return (
    <div className="relative w-full h-full flex flex-col justify-end p-8 md:p-12" style={{ minHeight: 220 }}>
      {backgroundImageUrl
        ? <>
            <img src={backgroundImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.52)" }} />
          </>
        : <div className="absolute inset-0" style={{
            background: primaryColor === '#000000'
              ? '#000000'
              : primaryColor === '#ffffff'
                ? '#ffffff'
                : `linear-gradient(145deg, ${primaryColor}dd 0%, #0a0a1acc 100%)`
          }} />
      }
      <div className="relative z-10">
        {logoUrl
          ? <img src={logoUrl} alt={siteName} className="h-12 object-contain mb-6" />
          : <div className="text-sm font-semibold mb-6 tracking-widest uppercase" style={{ color: brandingColor }}>Pixshare AI</div>
        }
        <h1 className="font-bold text-3xl md:text-4xl leading-tight drop-shadow-lg mb-3" style={{ color: titleColor }}>{welcomeTitle}</h1>
        {welcomeSubtitle && <p className="text-base leading-relaxed" style={{ color: subtitleColor }}>{welcomeSubtitle}</p>}
      </div>
    </div>
  );
};

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
  isLocked: boolean;
  defaultLanguage?: string;
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
  userEventMap?: Record<number, number>;
  userPhotoCountByEvent?: Record<number, number>;
}

interface LoggedInUser {
  userId: number;
  name?: string;
  photoUrl?: string;
}

type Phase =
  | "loading"
  | "email-input"
  | "otp-sending"
  | "otp-input"
  | "checking"
  | "selfie"
  | "registering"
  | "events"
  | "access-denied"
  | "request-sent"
  | "not-found";

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
  } catch { return null; }
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
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = base64;
  });
}

// ── Logout confirm overlay ────────────────────────────────────────────────────

interface LogoutConfirmProps { isHe: boolean; primaryColor: string; onConfirm: () => void; onCancel: () => void; }

const LogoutConfirm: React.FC<LogoutConfirmProps> = ({ isHe, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
    <div className="w-full max-w-xs mx-4 rounded-2xl p-6 space-y-4 text-center bg-white shadow-2xl">
      <LogOut className="w-9 h-9 mx-auto text-gray-400" />
      <p className="font-semibold text-lg text-gray-900">{isHe ? "להתנתק?" : "Sign out?"}</p>
      <p className="text-gray-500 text-sm">{isHe ? "תצטרכו להזדהות מחדש בכניסה הבאה" : "You'll need to verify again next time"}</p>
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm">{isHe ? "ביטול" : "Cancel"}</button>
        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm">{isHe ? "התנתק" : "Sign out"}</button>
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────

const SiteLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { language, setLanguage } = useLanguage();
  const isHe = language === "he";

  const previewUserId = searchParams.get("previewUserId");

  const [phase, setPhase] = useState<Phase>("loading");
  const [site, setSite] = useState<SiteData | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Email flow
  const [email, setEmail] = useState("");

  // OTP
  const otpRef0 = useRef<HTMLInputElement>(null);
  const otpRef1 = useRef<HTMLInputElement>(null);
  const otpRef2 = useRef<HTMLInputElement>(null);
  const otpRef3 = useRef<HTMLInputElement>(null);
  const otpRefs = [otpRef0, otpRef1, otpRef2, otpRef3];
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);

  // Register
  const [fullName, setFullName] = useState("");

  // Access request
  const [reqName, setReqName] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);

  const primaryColor = site?.primaryColor || "#6c47ff";

  // ── Load site ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!slug) { setPhase("not-found"); return; }
    apiService.getSiteBySlug(slug).then(async (data) => {
      if (!data || !data.isActive) { setPhase("not-found"); return; }
      setSite(data);

      // Apply the site's default language (overrides browser default)
      if (data.defaultLanguage === "en" || data.defaultLanguage === "he") {
        setLanguage(data.defaultLanguage as "he" | "en");
      }

      if (previewUserId) {
        const uid = parseInt(previewUserId, 10);
        if (!isNaN(uid)) {
          try {
            const info = await apiService.getSiteUserInfo(data.id, uid);
            if (info?.userId) {
              const u: LoggedInUser = { userId: info.userId, name: info.name, photoUrl: info.photoUrl };
              setLoggedInUser(u);
              await loadStats(data.id, uid);
              setPhase("events");
              return;
            }
          } catch { /* fall through */ }
        }
      }

      const session = loadSession(data.id);
      if (session) {
        // Show instantly from cache, then silently refresh from server in case
        // the photographer edited name / photo since last login
        setLoggedInUser(session);
        loadStats(data.id, session.userId);
        setPhase("events");

        apiService.getSiteUserInfo(data.id, session.userId)
          .then(fresh => {
            if (!fresh?.userId) return;
            const updated: LoggedInUser = {
              userId:   fresh.userId,
              name:     fresh.name     ?? session.name,
              photoUrl: fresh.photoUrl ?? session.photoUrl,
            };
            setLoggedInUser(updated);
            saveSession(updated, data.id); // keep cache in sync
          })
          .catch(() => { /* non-critical — keep showing cached data */ });
      } else {
        setPhase("email-input");
      }
    });
  }, [slug, previewUserId]);

  useEffect(() => {
    if (!site) return;
    const root = document.documentElement;
    if (site.primaryColor)   root.style.setProperty("--site-primary",   site.primaryColor);
    if (site.secondaryColor) root.style.setProperty("--site-secondary", site.secondaryColor);
    return () => { root.style.removeProperty("--site-primary"); root.style.removeProperty("--site-secondary"); };
  }, [site]);

  const loadStats = useCallback(async (siteId: number, userId?: number) => {
    try { setStats(await apiService.getSiteStats(siteId, userId)); } catch { /* silent */ }
  }, []);

  // ── Auth ────────────────────────────────────────────────────────────────────

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleSendOtp = async () => {
    if (!email.trim() || !site) return;
    if (!isValidEmail(email)) {
      setError(isHe ? "כתובת מייל לא תקינה" : "Invalid email address");
      return;
    }
    setError(null);
    setPhase("otp-sending");
    setOtpDigits(["", "", "", ""]);
    try {
      await apiService.siteSendOtpEmail(email.trim());
      setPhase("otp-input");
      setTimeout(() => otpRefs[0].current?.focus(), 150);
    } catch {
      setError(isHe ? "שגיאה בשליחת קוד" : "Failed to send code");
      setPhase("email-input");
    }
  };

  const verifyAndContinue = async (code: string) => {
    if (code.length < 4 || !site) return;
    setError(null);
    setPhase("checking");

    const otpResult = await apiService.siteVerifyOtp(email.trim(), code);
    if (!otpResult.verified) {
      setError(isHe ? "הקוד שגוי, נסה שוב" : "Incorrect code, please try again");
      setOtpDigits(["", "", "", ""]);
      setPhase("otp-input");
      setTimeout(() => otpRefs[0].current?.focus(), 150);
      return;
    }

    const loginResult = await apiService.siteLoginByContact(site.id, { email: email.trim() });

    if (loginResult.blocked) {
      setPhase("access-denied");
      return;
    }

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
    if (next.every(d => d !== "")) setTimeout(() => verifyAndContinue(next.join("")), 100);
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      const next = [...otpDigits]; next[idx - 1] = "";
      setOtpDigits(next); otpRefs[idx - 1].current?.focus();
    }
  };

  const handleSelfieCapture = async (imageData: string) => {
    if (!site) return;
    setError(null);
    setPhase("registering");
    try {
      const compressed = await compressBase64Image(imageData, 640, 0.75);
      const result = await apiService.siteRegister(site.id, compressed, {
        fullName:         fullName.trim() || undefined,
        email:            email.trim(),
        authenticateBy:   "Email",
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

  const handleSubmitAccessRequest = async () => {
    if (!site || !email.trim()) return;
    setSubmittingReq(true);
    try {
      await apiService.siteSubmitAccessRequest(site.id, { email: email.trim(), name: reqName.trim() || undefined, note: reqNote.trim() || undefined });
      setPhase("request-sent");
    } catch {
      setError(isHe ? "שגיאה בשליחת הבקשה" : "Failed to send request");
    }
    setSubmittingReq(false);
  };

  const handleEventClick = (event: SiteEventData) => {
    if (!loggedInUser || !stats) return; // wait for stats to load before navigating
    const perEventUserId = stats.userEventMap?.[event.eventId] ?? loggedInUser.userId;
    window.open(`/site-event/${event.eventId}?userid=${perEventUserId}`, "_blank");
  };

  const handleLogout = () => {
    // Clear all session data — both the main key and any residual keys
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("siteUserId");
    sessionStorage.removeItem("userid");
    sessionStorage.removeItem("favoriteImages");
    setLoggedInUser(null); setStats(null); setEmail(""); setFullName("");
    setOtpDigits(["", "", "", ""]); setError(null); setShowMyEventsOnly(false);
    setShowLogoutConfirm(false); setPhase("email-input");
  };

  // ── Google Auth ─────────────────────────────────────────────────────────────

  const handleGoogleSignIn = () => {
    if (!site) return;
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: "561704908227-debfddbhbg2ql1k9k5nmhe96pirfj9oh.apps.googleusercontent.com",
        scope: "email profile",
        callback: async (response: { access_token?: string }) => {
          if (!response.access_token) return;
          try {
            const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });
            const userInfo = await userInfoRes.json();
            const googleEmail: string = userInfo.email ?? "";
            const googleName: string  = userInfo.name  ?? "";
            if (!googleEmail) return;

            setEmail(googleEmail);
            setFullName(googleName);
            setPhase("checking");

            const loginResult = await apiService.siteLoginByContact(site.id, { email: googleEmail });

            if (loginResult.blocked) {
              setPhase("access-denied");
              return;
            }

            if (loginResult.success && loginResult.userId) {
              const user: LoggedInUser = { userId: loginResult.userId, name: loginResult.name, photoUrl: loginResult.photoUrl };
              setLoggedInUser(user);
              saveSession(user, site.id);
              await loadStats(site.id, loginResult.userId);
              setPhase("events");
            } else {
              // New user — pre-filled, go straight to selfie
              setPhase("selfie");
            }
          } catch {
            setError(isHe ? "שגיאה בכניסה עם Google" : "Google sign-in failed");
            setPhase("email-input");
          }
        },
      });
      client.requestAccessToken();
    } catch {
      setError(isHe ? "Google לא זמין כרגע" : "Google sign-in unavailable");
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const welcomeTitle    = isHe ? (site?.welcomeTitleHe    || site?.name || "הגלריה שלי") : (site?.welcomeTitleEn    || site?.name || "My Gallery");
  const welcomeSubtitle = isHe ? (site?.welcomeSubtitleHe || "")                          : (site?.welcomeSubtitleEn || "");
  const userEventIds    = stats?.userEventIds ?? [];
  const allEvents       = site?.events ?? [];
  const myEventsCount   = allEvents.filter(e => userEventIds.includes(e.eventId)).length;
  const baseEvents      = showMyEventsOnly
    ? allEvents.filter(e => userEventIds.includes(e.eventId))
    : allEvents;
  const visibleEvents   = searchQuery.trim()
    ? baseEvents.filter(e => e.eventName.toLowerCase().includes(searchQuery.toLowerCase()))
    : baseEvents;

  // User initials for avatar fallback
  const userInitials = (loggedInUser?.name || "")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  const navBg = "#0f1f3d";

  // ── Full-screen states ───────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (phase === "not-found") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900 gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">{isHe ? "הגלריה לא נמצאה" : "Gallery not found"}</h1>
        <p className="text-gray-500">{isHe ? "הקישור אינו תקין או שהגלריה אינה פעילה" : "The link is invalid or the gallery is inactive"}</p>
      </div>
    );
  }

  // ── Events (logged in) ────────────────────────────────────────────────────────

  if (phase === "events" && site && loggedInUser) {
    const avatarEl = (size: number, fontSize: number) => (
      <div
        style={{
          width: size, height: size, borderRadius: "50%", background: primaryColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize, flexShrink: 0, overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.25)",
        }}
      >
        {loggedInUser.photoUrl
          ? <img src={loggedInUser.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          : userInitials
        }
      </div>
    );

    return (
      <div dir={isHe ? "rtl" : "ltr"} style={{ minHeight: "100svh", display: "flex", flexDirection: "column", background: "#f0f2f8", fontFamily: "'Inter',system-ui,sans-serif" }}>
        {showLogoutConfirm && (
          <LogoutConfirm isHe={isHe} primaryColor={primaryColor} onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} />
        )}

        {/* ── Navbar ── */}
        <nav style={{ background: navBg, padding: "0 16px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          {/* Start: logout + name + avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8, padding: "5px 10px", color: "rgba(255,255,255,0.75)",
                fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {isHe ? "התנתק" : "Sign out"}
              <LogOut style={{ width: 13, height: 13 }} />
            </button>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              className="hidden sm:block">
              {loggedInUser.name}
            </span>
            {avatarEl(34, 13)}
          </div>

          {/* End: logo + site name */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {site.logoUrl && (
              <img src={site.logoUrl} alt={site.name} style={{ height: 28, objectFit: "contain", maxWidth: 80 }} />
            )}
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {site.name}
            </span>
            {isHe ? <ChevronLeft style={{ width: 18, height: 18, color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                   : <ChevronRight style={{ width: 18, height: 18, color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />}
          </div>
        </nav>

        {/* ── Hero banner ── */}
        <div style={{ background: navBg, position: "relative", overflow: "hidden", padding: "20px 16px 28px" }}>
          {site.backgroundImageUrl && (
            <img src={site.backgroundImageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.08 }} />
          )}
          <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            {/* Stats */}
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: "clamp(28px,7vw,42px)", color: primaryColor, lineHeight: 1 }}>{myEventsCount}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 4 }}>{isHe ? "האירועים שלי" : "My Events"}</p>
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: "clamp(28px,7vw,42px)", color: primaryColor, lineHeight: 1 }}>{stats?.userTotalPhotos ?? 0}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 4 }}>{isHe ? "התמונות שלי" : "My Photos"}</p>
              </div>
            </div>

            {/* Greeting + avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, textAlign: isHe ? "right" : "left" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: "clamp(15px,4vw,20px)", whiteSpace: "nowrap" }}>
                  {isHe ? "שלום! 👋" : "Hello! 👋"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "clamp(11px,2.5vw,13px)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                  {isHe ? `ברוך הבא לגליריית ${site.name}` : `Welcome to ${site.name}`}
                </p>
              </div>
              {avatarEl(44, 16)}
            </div>
          </div>
        </div>

        {/* ── Search + Filters ── */}
        <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", padding: "14px 16px 8px" }}>
          {/* Search */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", [isHe ? "right" : "left"]: 12, width: 16, height: 16, color: "#9ca3af", pointerEvents: "none" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isHe ? "חיפוש אירוע..." : "Search event..."}
              style={{
                width: "100%", boxSizing: "border-box", borderRadius: 14,
                border: "1.5px solid #e5e7eb", background: "#fff",
                padding: isHe ? "11px 40px 11px 14px" : "11px 14px 11px 40px",
                fontSize: 14, outline: "none", color: "#1a1a2e",
              }}
            />
          </div>

          {/* Toggle pills */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { my: true,  label: isHe ? "האירועים שלי" : "My Events",  count: myEventsCount },
              { my: false, label: isHe ? "כל האירועים"  : "All Events", count: allEvents.length },
            ].map(({ my, label, count }) => {
              const active = showMyEventsOnly === my;
              return (
                <button
                  key={String(my)}
                  onClick={() => setShowMyEventsOnly(my)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    borderRadius: 50, padding: "7px 14px",
                    background: active ? navBg : "#fff",
                    color: active ? "#fff" : "#6b7280",
                    border: active ? `1.5px solid ${navBg}` : "1.5px solid #e5e7eb",
                    fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer",
                    transition: "all 0.15s", flexShrink: 0,
                  }}
                >
                  {my ? <User style={{ width: 12, height: 12 }} /> : <LayoutGrid style={{ width: 12, height: 12 }} />}
                  {label}
                  <span style={{ opacity: 0.65, fontSize: 12 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Events grid ── */}
        <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", padding: "10px 16px 40px", flex: 1 }}>
          {visibleEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
              <ImageIcon style={{ width: 36, height: 36, margin: "0 auto 10px", opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>{isHe ? "אין אירועים להצגה" : "No events to show"}</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: 14 }}>
              {visibleEvents.map((ev) => {
                const hasUserPhotos = userEventIds.includes(ev.eventId);
                const myPhotoCount  = stats?.userPhotoCountByEvent?.[ev.eventId] ?? 0;
                const dateStr = ev.eventDate
                  ? new Date(ev.eventDate).toLocaleDateString(isHe ? "he-IL" : "en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : null;

                return (
                  <div
                    key={ev.eventId}
                    style={{
                      background: "#fff", borderRadius: 18, overflow: "hidden",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column",
                      border: hasUserPhotos ? `1.5px solid ${primaryColor}40` : "1.5px solid transparent",
                    }}
                  >
                    {/* Cover image */}
                    <div
                      onClick={() => handleEventClick(ev)}
                      style={{ position: "relative", aspectRatio: "16/10", background: "#1a1a2e", cursor: "pointer", overflow: "hidden" }}
                    >
                      {ev.coverImageUrl
                        ? <img src={ev.coverImageUrl} alt={ev.eventName}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
                            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
                        : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${primaryColor}55, #1a1a2e)` }} />
                      }
                      {/* Gradient */}
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 50%)" }} />

                      {/* User badge — top start */}
                      {hasUserPhotos && (
                        <div style={{
                          position: "absolute", top: 10, [isHe ? "right" : "left"]: 10,
                          background: primaryColor, color: "#fff", borderRadius: 50,
                          padding: "3px 9px", fontSize: 11, fontWeight: 700,
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                          <User style={{ width: 9, height: 9 }} />
                          {myPhotoCount} {isHe ? "שלי" : "mine"}
                        </div>
                      )}

                      {/* Bottom: date + total */}
                      <div style={{ position: "absolute", bottom: 0, insetInline: 0, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {dateStr && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
                            <CalendarDays style={{ width: 10, height: 10 }} />{dateStr}
                          </span>
                        )}
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.8)", fontSize: 11, marginInlineStart: "auto" }}>
                          <ImageIcon style={{ width: 10, height: 10 }} />{ev.totalPhotos}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ minWidth: 0, cursor: "pointer" }} onClick={() => handleEventClick(ev)}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                          {ev.eventName}
                        </p>
                        <p style={{ fontSize: 12, color: hasUserPhotos ? primaryColor : "#9ca3af" }}>
                          {hasUserPhotos
                            ? `${myPhotoCount} ${isHe ? "תמונות שלך" : "your photos"}`
                            : (isHe ? "אין תמונות שלך עדיין" : "No photos of you yet")
                          }
                        </p>
                      </div>
                      {hasUserPhotos && (
                        <button
                          onClick={() => handleEventClick(ev)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                            background: `${primaryColor}18`, color: primaryColor,
                            border: "none", borderRadius: 10, padding: "6px 12px",
                            fontSize: 12, fontWeight: 700, cursor: "pointer",
                          }}
                        >
                          <Download style={{ width: 11, height: 11 }} />
                          {isHe ? "הורד" : "Download"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Split-screen auth layout ──────────────────────────────────────────────────

  const inputBase: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1.5px solid #e5e7eb", background: "#fff", color: "#1a1a2e",
    fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  };

  const PrimaryBtn: React.FC<{ onClick?: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode }> = ({ onClick, disabled, loading, children }) => (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ width: "100%", padding: "13px 20px", borderRadius: 12, fontWeight: 700, fontSize: 15, border: "none",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        background: disabled || loading ? "#d1d5db" : primaryColor, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.15s" }}>
      {loading && <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />}
      {children}
    </button>
  );

  const BackBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 14, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
      {isHe ? "→ חזרה" : "← Back"}
    </button>
  );

  // BrandingPanel is defined outside this component — pass derived values as props

  // Right form content per phase
  const renderForm = () => {
    if (phase === "email-input") return (
      <div className="flex flex-col gap-5 py-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{isHe ? "ברוכים הבאים" : "Welcome"}</h2>
          <p className="text-gray-500 text-sm">{isHe ? "הזינו מייל כדי להיכנס לגלריה" : "Enter your email to access the gallery"}</p>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            {isHe ? "כתובת מייל" : "Email address"}
          </label>
          <input type="email" dir="ltr" autoFocus placeholder="name@example.com"
            value={email} onChange={e => { setEmail(e.target.value); setError(null); }}
            onKeyDown={e => e.key === "Enter" && email.trim() && handleSendOtp()}
            style={inputBase}
            onFocus={e => (e.target.style.borderColor = primaryColor)}
            onBlur={e => {
              if (email.trim() && !isValidEmail(email)) {
                e.target.style.borderColor = "#ef4444";
                setError(isHe ? "כתובת מייל לא תקינה" : "Invalid email address");
              } else {
                e.target.style.borderColor = "#e5e7eb";
              }
            }} />
        </div>
        {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}
        <PrimaryBtn onClick={handleSendOtp} disabled={!email.trim() || !isValidEmail(email)}>
          <Mail style={{ width: 16, height: 16 }} />
          {isHe ? "שלח קוד אימות" : "Send Verification Code"}
        </PrimaryBtn>
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-100" />
          <span className="text-gray-400 text-xs">{isHe ? "או" : "or"}</span>
          <div className="flex-1 border-t border-gray-100" />
        </div>
        <button
          onClick={handleGoogleSignIn}
          style={{ width: "100%", padding: "12px 20px", borderRadius: 12, border: "1.5px solid #e5e7eb",
            background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#374151" }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {isHe ? "כניסה עם Google" : "Continue with Google"}
        </button>
      </div>
    );

    if (phase === "otp-sending" || phase === "checking") return (
      <div className="flex flex-col items-center justify-center gap-5 py-12">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: primaryColor }} />
        <p className="text-gray-600 font-medium">
          {phase === "otp-sending" ? (isHe ? "שולח קוד..." : "Sending code...") : (isHe ? "מאמת..." : "Verifying...")}
        </p>
      </div>
    );

    if (phase === "otp-input") return (
      <div className="flex flex-col gap-5 py-4">
        <BackBtn onClick={() => { setError(null); setPhase("email-input"); }} />
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{isHe ? "הזינו קוד אימות" : "Enter Verification Code"}</h2>
          <p className="text-gray-500 text-sm">{isHe ? `שלחנו קוד ל-${email}` : `We sent a code to ${email}`}</p>
        </div>
        <div className="flex gap-3 justify-center" dir="ltr">
          {otpDigits.map((d, idx) => (
            <input key={idx} ref={otpRefs[idx]} type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleOtpDigitChange(idx, e.target.value)}
              onKeyDown={e => handleOtpKeyDown(idx, e)}
              style={{ width: 58, height: 68, textAlign: "center", fontSize: 28, fontWeight: 700, borderRadius: 12,
                border: d ? `2px solid ${primaryColor}` : "2px solid #e5e7eb",
                background: "#fff", color: "#1a1a2e", outline: "none", transition: "border 0.15s" }} />
          ))}
        </div>
        {error && <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center" }}>{error}</p>}
        <PrimaryBtn onClick={() => verifyAndContinue(otpDigits.join(""))} disabled={otpDigits.some(d => !d)}>
          {isHe ? "אמת קוד" : "Verify Code"}
        </PrimaryBtn>
        <button onClick={() => { setError(null); setPhase("email-input"); }}
          style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 13 }}>
          {isHe ? "שלח קוד חדש" : "Resend code"}
        </button>
      </div>
    );

    if (phase === "selfie" || phase === "registering") return (
      <div className="flex flex-col gap-4 py-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{isHe ? "כמעט שם! 🎉" : "Almost there! 🎉"}</h2>
          <p className="text-gray-500 text-sm">{isHe ? "צלמו סלפי ואנחנו נמצא את כל התמונות שלכם" : "Take a selfie and we'll find all your photos"}</p>
        </div>

        {/* שם מלא — חובה */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            {isHe ? "שם מלא *" : "Full name *"}
          </label>
          <input
            type="text"
            placeholder={isHe ? "ישראל ישראלי" : "Your name"}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            style={{
              ...inputBase,
              borderColor: fullName.trim() ? "#e5e7eb" : undefined,
            }}
            onFocus={e => (e.target.style.borderColor = primaryColor)}
            onBlur={e => (e.target.style.borderColor = fullName.trim() ? "#e5e7eb" : "#f87171")}
          />
          {!fullName.trim() && phase === "selfie" && (
            <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>
              {isHe ? "שדה חובה" : "Required field"}
            </p>
          )}
        </div>

        {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}

        {phase === "registering" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
            <p className="text-gray-600">{isHe ? "נרשם לגלריה..." : "Registering..."}</p>
          </div>
        ) : (
          <SelfieCapture
            onCapture={(img) => {
              if (!fullName.trim()) {
                setError(isHe ? "יש להזין שם מלא לפני הצילום" : "Please enter your name before taking a selfie");
                return;
              }
              setError(null);
              handleSelfieCapture(img);
            }}
            onBack={() => { setError(null); setPhase("email-input"); }}
            withBTAction={true}
            autoOpenCamera={false}
            primaryColor={primaryColor}
          />
        )}
      </div>
    );

    if (phase === "access-denied") return (
      <div className="flex flex-col gap-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#fef2f2" }}>
            <ShieldOff style={{ width: 20, height: 20, color: "#ef4444" }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{isHe ? "הגלריה נעולה" : "Gallery Locked"}</h2>
            <p className="text-gray-500 text-sm mt-1">
              {isHe ? "המייל שלך טרם אושר. מלאו בקשת גישה ואנחנו נחזור אליכם." : "Your email isn't approved yet. Fill out a request and we'll get back to you."}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm" dir="ltr">
          <p className="text-gray-400 text-xs mb-0.5">Email</p>
          <p className="font-mono font-medium text-gray-700">{email}</p>
        </div>
        <div className="space-y-3">
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{isHe ? "שם מלא *" : "Full name *"}</label>
            <input type="text" placeholder={isHe ? "ישראל ישראלי" : "Your name"}
              value={reqName} onChange={e => setReqName(e.target.value)}
              style={inputBase}
              onFocus={e => (e.target.style.borderColor = primaryColor)}
              onBlur={e => (e.target.style.borderColor = "#e5e7eb")} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{isHe ? "הערה (אופציונלי)" : "Note (optional)"}</label>
            <textarea placeholder={isHe ? "ספרו לנו מדוע אתם מבקשים גישה..." : "Tell us why you'd like access..."}
              value={reqNote} onChange={e => setReqNote(e.target.value)} rows={3}
              style={{ ...inputBase, resize: "vertical" as const }}
              onFocus={e => (e.target.style.borderColor = primaryColor)}
              onBlur={e => (e.target.style.borderColor = "#e5e7eb")} />
          </div>
        </div>
        {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}
        <PrimaryBtn onClick={handleSubmitAccessRequest} loading={submittingReq} disabled={!reqName.trim()}>
          {isHe ? "שלח בקשת גישה" : "Submit Access Request"}
        </PrimaryBtn>
        <BackBtn onClick={() => { setError(null); setPhase("email-input"); }} />
      </div>
    );

    if (phase === "request-sent") return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#f0fdf4" }}>
          <CheckCircle2 style={{ width: 36, height: 36, color: "#16a34a" }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{isHe ? "הבקשה נשלחה! ✅" : "Request Sent! ✅"}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            {isHe ? "בקשת הגישה נשלחה לאדמין. לאחר אישור תקבלו מייל עם קישור לגלריה." : "Your request was sent to the admin. Once approved you'll receive an email with the gallery link."}
          </p>
        </div>
      </div>
    );

    return null;
  };

  // ── Split-screen render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex" dir={isHe ? "rtl" : "ltr"} style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* Left branding — desktop only */}
      <div className="hidden md:block md:w-1/2 lg:w-[55%] sticky top-0 h-screen">
        <BrandingPanel
              backgroundImageUrl={site?.backgroundImageUrl}
              logoUrl={site?.logoUrl}
              siteName={site?.name}
              primaryColor={primaryColor}
              welcomeTitle={welcomeTitle}
              welcomeSubtitle={welcomeSubtitle}
            />
      </div>

      {/* Right form panel */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col min-h-screen bg-white">
        {/* Mobile branding banner */}
        <div className="md:hidden h-52 relative flex-shrink-0">
          <BrandingPanel
              backgroundImageUrl={site?.backgroundImageUrl}
              logoUrl={site?.logoUrl}
              siteName={site?.name}
              primaryColor={primaryColor}
              welcomeTitle={welcomeTitle}
              welcomeSubtitle={welcomeSubtitle}
            />
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 py-10">
          {/* Desktop logo */}
          <div className="hidden md:block mb-8">
            {site?.logoUrl
              ? <img src={site.logoUrl} alt={site?.name} className="h-10 object-contain" />
              : <span className="font-bold text-xl" style={{ color: primaryColor }}>{site?.name}</span>
            }
          </div>

          <div className="w-full max-w-sm mx-auto">
            {renderForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteLandingPage;
