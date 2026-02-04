# Dynamic Text Sizing Research

## Overview

The goal is to implement dynamic text sizing for the `QuestionCard` component to ensure that questions of varying lengths (from short phrases to long paragraphs) fit perfectly within the card's boundaries without overflow or excessive whitespace.

## Inspiration & Sources (Mandatory)

> [!IMPORTANT]
> You must list all websites and URLs where information or inspiration was gathered.

- **StackOverflow**: [React Text Fit Best Practices](https://stackoverflow.com/questions/tagged/react+font-size) - Discusses various approaches including generic libraries vs custom hooks.
- **Auto Text Size**: [npmjs.com/package/auto-text-size](https://www.npmjs.com/package/auto-text-size) - A modern, maintained library for fitting text.
- **CSS Container Queries**: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Containment/Container_queries) - Background on `cqw`/`cqh` units.
- **React-Textfit**: [GitHub](https://github.com/malte-wessel/react-textfit) - The classic (but unmaintained) reference for this behavior.

## Design Implementation

- **Visual Style**: The text needs to fill the available space while respecting the "Glassmorphism" card aesthetic.
- **Color Palette**: Existing transparent/gradient text styles must be preserved.
- **Typography**: The existing font (likely Inter or system sans) should be scaled. The _weight_ is `extrabold`, which should be maintained.

## Approaches

### 1. CSS Container Queries (`cqw`)

- **Pros**: Pure CSS, performant.
- **Cons**: Only scales based on _container width_, not _content length_. A short string and a long string would have the exact same font size if the container width is the same, causing the long string to overflow. **Rejected for this specific use case.**

### 2. External Libraries (`auto-text-size`)

- **Pros**: Plug-and-play, handles edge cases (resizing).
- **Cons**: Adds dependency. `auto-text-size` is a good candidate (2kb).

### 3. Custom Hook (Binary Search)

- **Pros**: Zero dependencies, full control over the `fontSize` state (allowing for smooth transitions with Framer Motion).
- **Cons**: Requires writing the measurement logic.

## Recommended Solution: Custom `useTextFit` Hook

Given the project already uses `framer-motion` and requires a "premium" feel, a custom hook allows us to animate the font size change if needed, or at least control the exact rendering to avoid a "Flash of Unstyled Text" (FOUT).

### Algorithm

1.  **Ref**: Create a ref for the text container.
2.  **Measure**: In `useLayoutEffect`, check if `scrollHeight > clientHeight` or `scrollWidth > clientWidth`.
3.  **Adjust**:
    - Start with a `maxFontSize`.
    - Binary search or iteratively decrement `fontSize` until content fits.
    - Set `minFontSize` floor.
4.  **Observer**: Use `ResizeObserver` to re-calculate on window/card resize.

## Code Snippet (Core Logic)

```typescript
import { useState, useLayoutEffect, useRef } from "react";

export function useTextFit(
  content: string,
  max: number = 40,
  min: number = 16,
) {
  const ref = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(max);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const adjust = () => {
      let current = max;
      el.style.fontSize = `${current}px`;

      while (
        (el.scrollHeight > el.clientHeight ||
          el.scrollWidth > el.clientWidth) &&
        current > min
      ) {
        current--;
        el.style.fontSize = `${current}px`;
      }
      setFontSize(current);
    };

    adjust();
  }, [content, max, min]);

  return { ref, fontSize };
}
```

## Considerations

- **Performance**: `useLayoutEffect` prevents visual flicker but blocks painting briefly. For a single card, this is negligible.
- **Accessibility**: Ensure text doesn't become too small. Enforce a strict `minFontSize`.
