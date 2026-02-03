"use client";
import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, ArrowRight, Loader2, Sparkles } from "lucide-react";

interface OnboardingModalProps {
  firebaseUser: User;
  onComplete: (user: any) => void;
}

export function OnboardingModal({
  firebaseUser,
  onComplete,
}: OnboardingModalProps) {
  const [birthday, setBirthday] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationState, setLocationState] = useState<{
    ip: string;
    description: string;
    coords?: { lat: number; lng: number };
    source: "ip" | "gps" | "none";
  }>({ ip: "", description: "", source: "none" });

  const [step, setStep] = useState(1); // For potential multi-step animations (entering vs submitting)

  useEffect(() => {
    let isMounted = true;

    const fetchLocationData = async () => {
      // 1. Start fetching IP data (Fallback & Metadata)
      try {
        const res = await fetch("https://ipapi.co/json/");
        const ipData = await res.json();

        if (isMounted) {
          setLocationState((prev) => ({
            ...prev,
            ip: ipData.ip || "",
            description:
              ipData.city && ipData.country_name
                ? `${ipData.city}, ${ipData.country_name}`
                : prev.description,
            source: prev.source === "gps" ? "gps" : "ip", // Keep GPS if already found
          }));
        }
      } catch (e) {
        console.error("IP Fetch Failed", e);
      }

      // 2. Try Browser Geolocation (Higher Priority for Coordinates)
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (isMounted) {
              setLocationState((prev) => ({
                ...prev,
                coords: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                },
                source: "gps",
                // If we haven't found a description yet, we might want to reverse geocode here,
                // but for now we'll rely on IP for the "Name" of the place + exact coords.
              }));
            }
          },
          (err) => {
            console.warn("Geolocation denied or error", err);
          },
          { timeout: 10000 },
        );
      }
    };

    fetchLocationData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthday) return;

    setLoading(true);
    try {
      // Construct final location string
      let locationString = locationState.description || "Unknown";
      if (locationState.coords) {
        locationString += ` (${locationState.coords.lat.toFixed(4)}, ${locationState.coords.lng.toFixed(4)})`;
      }

      const res = await fetch("/api/auth/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          image: firebaseUser.photoURL,
          birthday,
          ip: locationState.ip,
          location: locationString,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onComplete(data.user);
      } else {
        alert("Found an issue: " + data.error);
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden"
        >
          {/* Decorative background gradients */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px]" />

          <div className="relative p-8 z-10">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-rose-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
              >
                <Sparkles className="text-white" size={32} />
              </motion.div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
                Welcome, {firebaseUser.displayName?.split(" ")[0]}!
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Let's personalize your experience.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Birthday Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" />
                  When is your birthday?
                </label>
                <div className="relative group">
                  <input
                    type="date"
                    required
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all group-hover:bg-white dark:group-hover:bg-slate-800"
                  />
                </div>
              </div>

              {/* Location Indicator (Visual only, auto-detected) */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-sm text-slate-500 dark:text-slate-400">
                <div
                  className={`p-2 rounded-full ${locationState.description ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-500 animate-pulse"}`}
                >
                  <MapPin size={16} />
                </div>
                <div className="flex-1">
                  {locationState.description ? (
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {locationState.description}
                    </span>
                  ) : (
                    <span>Detecting location...</span>
                  )}
                  {locationState.coords && (
                    <span className="text-xs text-green-500 block">
                      ✓ Precise location found
                    </span>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || !birthday}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Start Journey
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
