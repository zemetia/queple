# Landing Page Redesign Research

## Overview

The goal is to redesign the landing page ("start play" screen) of Queple to be "good simple modern, minimalist" with patterns similar to those used in the game cards. The user explicitly requested "no dark blue" and ensuring high contrast (no color collapse). Additionally, the intensity/difficulty level selector needs to be a customizable range (min-max) slider instead of presets.

## Inspiration & Sources

> [!IMPORTANT]
> You must list all websites and URLs where information or inspiration was gathered.

- **Dribbble**: [Minimalist Mobile Game UI](https://dribbble.com/search/minimalist-mobile-game-ui) - Looking for clean typography and subtle background patterns.
- **Awwwards**: [Clean Web Design](https://www.awwwards.com/websites/clean/) - For modern, spacious layouts.
- **CSS Tricks**: [Dual Range Slider](https://css-tricks.com/multi-thumb-sliders-particular-two-thumb-slider/) - Implementation details for the range slider.
- **Radix UI**: [Slider](https://www.radix-ui.com/primitives/docs/components/slider) - Reference for accessible slider behavior (even if we implement custom).

## Design Implementation

- **Visual Style**: Minimalist, clean, "premium".
- **Patterns**: Reuse the existing patterns (`/patterns/male.png`, `/patterns/female.png` etc.) but apply them subtly (low opacity, grayscale, or blended) to the background to create texture without overwhelming the content.
- **Color Palette**:
  - **Background**: Off-white (`#f8fafc` - slate-50) or very light gray.
  - **Text**: Dark Slate (`#0f172a` - slate-900) for primary, lighter slate (`#64748b` - slate-500) for secondary.
  - **Accents**: Rose/Pink (`#f43f5e`) or Indigo (`#6366f1`) for buttons/active states, but _not_ dark blue.
  - **Contrast**: Ensure WCAG AA compliance. using high contrast text on light backgrounds.

## Features to Implement

1.  **Dual Range Slider**: A slider with two handles to pick `min` and `max` level (1-10).
2.  **Pattern Background**: A container with the game patterns tiled or placed artistically.
3.  **Clean Typography**: Use the existing font stack but with better spacing and weight hierarchy.

## Code Snippet (Dual Range Slider Idea)

We can use a simple flex implementation or `input type="range"` heavily styled, but for a dual slider, a custom component using `framer-motion` (already in project) is best for smoothness.

```tsx
// Concept for Framer Motion Slider
<div className="relative h-2 bg-slate-200 rounded-full">
  <motion.div
    className="absolute h-full bg-rose-500 rounded-full"
    style={{ left: minPct, right: maxPct }}
  />
  <motion.div
    drag="x"
    className="absolute w-6 h-6 bg-white shadow-md rounded-full ...handle"
  />
  <motion.div
    drag="x"
    className="absolute w-6 h-6 bg-white shadow-md rounded-full ...handle"
  />
</div>
```

## Considerations

- **No Dark Blue**: Avoid `bg-blue-900` or deep navy tones requested to be avoided.
- **Responsive**: The landing page is likely mobile-first or needs to look good on mobile.
