"use client";

const DEVICE_ID_KEY = "queple_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Fallback to simpler random if crypto is not available (though rare now)
    deviceId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? `guest_${crypto.randomUUID()}` 
      : `guest_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}
