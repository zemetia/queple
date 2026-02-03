"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { OnboardingModal } from "./OnboardingModal";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      try {
        if (currUser) {
          // Check if user exists in DB
          const res = await fetch("/api/auth/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: currUser.uid }),
          });
          const data = await res.json();

          if (!data.exists) {
            setNeedsOnboarding(true);
          } else {
            setNeedsOnboarding(false);

            // Update Location if available (Login Success for existing user)
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  try {
                    const { latitude, longitude } = position.coords;
                    // Storing as "Lat, Long" string format
                    const locationStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

                    await fetch("/api/auth/sync", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        uid: currUser.uid,
                        email: currUser.email,
                        location: locationStr,
                      }),
                    });
                  } catch (err) {
                    console.error("Failed to sync location", err);
                  }
                },
                (err) => console.warn("Geolocation denied or error", err),
                { timeout: 10000 },
              );
            }
          }

          setUser(currUser);
        } else {
          setUser(null);
          setNeedsOnboarding(false);
        }
      } catch (error) {
        console.error("Auth check failed", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setNeedsOnboarding(false);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      {children}
      {user && needsOnboarding && (
        <OnboardingModal
          firebaseUser={user}
          onComplete={(userData) => {
            setNeedsOnboarding(false);
            // If onboarding is complete, we might want to ensure user state is updated or validated
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
