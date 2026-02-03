# Engaging Onboarding & Location Flow Research

## Overview

The goal is to create a seamless, high-trust onboarding experience that transitions users from "Login" to "Playing" with minimal friction while collecting necessary data (Birthday, Location). The UI should be "engaging" using modern aesthetics (Glassmorphism, soft gradients) and smooth interactions.

## Inspiration & Sources

> [!IMPORTANT]
> Sources used for design patterns and technical implementation.

- **Framer Motion Examples**: [Framer Motion Documentation](https://www.framer.com/motion/) - For staggered animations and modal transitions.
- **Geolocation API**: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) - For browser-based location logic.
- **Glassmorphism Generator**: [CSS Glass](https://css.glass/) - For refining the card aesthetic.

## Design Implementation

- **Visual Style**: Premium Glassmorphism. Deep blurs (`backdrop-filter: blur(20px)`), subtle white borders, and soft underlying gradients (Blobs).
- **Color Palette**:
  - Primary: Trust Blue (`#3b82f6`) -> representing stability.
  - Secondary: Soft Rose (`#f43f5e`) -> representing warmth/match.
  - Background: Dynamic, moving subtle gradients.
- **Typography**: Inter (System Default), keeping it clean and readable.

## Animation Implementation (Framer Motion)

- **Entrance**: Heavy use of `AnimatePresence`.
  - Modal Overlay: Fade in (`opacity: 0 -> 1`).
  - Card: Scale + Slide Up (`y: 20, scale: 0.95` -> `y: 0, scale: 1`).
- **Micro-interactions**:
  - Buttons: `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.98 }}`.
  - Input Focus: Smooth border transition and shadow bloom.

## Location Logic Flow

To maximize data accuracy while maintaining privacy/trust:

1. **Parallel Attempt**: Try fetching IP-based location (fast, coarse) AND Browser Geolocation (slow, precise) simultaneously.
2. **Fallback**: If Browser permission is denied, silently fall back to IP location.
3. **UX**: Show a "Locating..." micro-animation to indicate setup is happening, but don't block user input (Birthday) if possible, or make it a specific "Setup" step.

## Code Snippet (Location Logic)

```javascript
const getUserLocation = async () => {
  // 1. IP Location (Fallback)
  const ipPromise = fetch("https://ipapi.co/json/").then((r) => r.json());

  // 2. Browser Geolocation (Primary)
  const geoPromise = new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject("No Geo");
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
    );
  });

  // Race or Prioritize...
};
```

## Structure Considerations

- **Component**: `OnboardingModal` should remain self-contained.
- **State**: Controlled by `AuthProvider` is correct (Global Guard).
