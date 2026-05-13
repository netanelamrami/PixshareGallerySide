/**
 * SiteEventRedirect
 *
 * Receives /site-event/:eventId?userid=X
 * Fetches the event by ID to get its eventLink, then redirects to
 * /:eventLink?userid=X so the normal gallery page handles it.
 *
 * The server needs to expose GET /api/Event/get?id={id}
 * which already exists (EventController GET endpoint).
 */
import { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const SiteEventRedirect = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get("userid");

  useEffect(() => {
    if (!eventId) { navigate("/"); return; }

    fetch(`${BASE_URL}/Event/get?id=${eventId}`)
      .then(r => r.ok ? r.json() : null)
      .then(event => {
        if (!event?.eventLink) { navigate("/event-not-found"); return; }
        const dest = `/${event.eventLink}${userId ? `?userid=${userId}` : ""}`;
        navigate(dest, { replace: true });
      })
      .catch(() => navigate("/event-not-found"));
  }, [eventId, userId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="w-10 h-10 text-white animate-spin" />
    </div>
  );
};

export default SiteEventRedirect;
