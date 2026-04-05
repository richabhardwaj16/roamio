import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, remove, set } from "firebase/database";
import { realtimeDb } from "../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const MAX_LIVE_UPDATES = 10; // 5 minutes at 30s interval

function formatPhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function buildMapLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    );
  });
}

export default function SOSButton() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [shareLive, setShareLive] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [liveTimer, setLiveTimer] = useState(null);

  const sosApiUrl = import.meta.env.VITE_SOS_API_URL || "";

  useEffect(() => {
    if (!user?.uid) return;
    const contactsRef = ref(realtimeDb, `users/${user.uid}/emergencyContacts`);
    const unsubscribe = onValue(contactsRef, (snapshot) => {
      const value = snapshot.val() || {};
      const list = Object.entries(value).map(([id, contact]) => ({
        id,
        ...contact,
      }));
      setContacts(list);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    return () => {
      if (liveTimer) {
        window.clearInterval(liveTimer);
      }
    };
  }, [liveTimer]);

  const mapLink = useMemo(() => {
    if (!location) return "";
    return buildMapLink(location.latitude, location.longitude);
  }, [location]);

  async function startLiveLocation() {
    if (!user?.uid || isSharing) return;
    setIsSharing(true);

    const updatesRef = ref(realtimeDb, `users/${user.uid}/sos/updates`);
    let count = 0;

    const timer = window.setInterval(async () => {
      if (count >= MAX_LIVE_UPDATES) {
        window.clearInterval(timer);
        setIsSharing(false);
        return;
      }
      count += 1;
      try {
        const coords = await getLocation();
        const payload = {
          ...coords,
          mapLink: buildMapLink(coords.latitude, coords.longitude),
          createdAt: Date.now(),
        };
        await push(updatesRef, payload);
        await set(ref(realtimeDb, `users/${user.uid}/sos/current`), payload);
      } catch {
        // Ignore transient geo errors during live updates.
      }
    }, 30000);

    setLiveTimer(timer);
  }

  async function handleTrigger() {
    if (!user?.uid) {
      showToast({ title: "Sign in required", message: "Please sign in to use SOS.", tone: "error" });
      return;
    }

    setConfirming(true);
    setLocationError("");

    try {
      const coords = await getLocation();
      setLocation(coords);

      const payload = {
        ...coords,
        mapLink: buildMapLink(coords.latitude, coords.longitude),
        createdAt: Date.now(),
      };

      await set(ref(realtimeDb, `users/${user.uid}/sos/current`), payload);
      await push(ref(realtimeDb, `users/${user.uid}/sos/events`), payload);

      if (shareLive) {
        await startLiveLocation();
      }

      if (sosApiUrl) {
        const message = `Emergency alert from Roamio user. Live location: ${payload.mapLink}`;
        await fetch(`${sosApiUrl}/api/sos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            message,
            contacts: contacts.map((contact) => ({
              name: contact.name,
              phone: contact.phone,
              relation: contact.relation,
            })),
          }),
        });
      }

      showToast({
        title: "SOS sent",
        message: "Location shared and emergency alert prepared.",
        tone: "success",
      });
      setOpen(false);
    } catch (error) {
      const reason = error?.message || "Unable to access your location.";
      setLocationError(reason);
      showToast({ title: "Location error", message: reason, tone: "error" });
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 h-16 w-16 rounded-full bg-red-600 text-white shadow-xl shadow-red-500/40 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300"
        onClick={() => setOpen(true)}
        aria-label="Open SOS"
      >
        <span className="relative flex h-full w-full items-center justify-center font-bold tracking-wide">
          SOS
          <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-red-300">Emergency</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Trigger SOS Alert?</h2>
                <p className="mt-2 text-sm text-slate-300">
                  We will fetch your live location and prepare an emergency message.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4 rounded-2xl border border-white/5 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Share live location</p>
                  <p className="text-xs text-slate-300">Every 30s for 5 minutes.</p>
                </div>
                <button
                  type="button"
                  className={`h-6 w-12 rounded-full p-1 transition ${shareLive ? "bg-emerald-500" : "bg-slate-600"}`}
                  onClick={() => setShareLive((prev) => !prev)}
                  aria-pressed={shareLive}
                >
                  <span className={`block h-4 w-4 rounded-full bg-white transition ${shareLive ? "translate-x-6" : ""}`} />
                </button>
              </div>

              {locationError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                  {locationError}
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-200">
                Preview message:
                <div className="mt-2 text-slate-100">
                  I need help. My live location: {mapLink || "Location will appear here."}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                onClick={() => (window.location.href = "tel:112")}
              >
                Call 112
              </button>
              {contacts[0] && (
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => (window.location.href = `tel:${formatPhone(contacts[0].phone)}`)}
                >
                  Call {contacts[0].name}
                </button>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/40 disabled:opacity-70"
                onClick={handleTrigger}
                disabled={confirming}
              >
                {confirming ? "Sending..." : "Confirm SOS"}
              </button>
              <button
                type="button"
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/80"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 text-xs text-slate-400">
              Premium: SMS + auto-call sends via Twilio when configured.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
