# Dynamic Font Sizing Research

## Overview

The goal is to fit variable-length question text within a fixed card container while maintaining readability. When questions are too long, the font size should decrease.

## Inspiration & Sources

- **CSS Tricks**: [Fluid Typography](https://css-tricks.com/snippets/css/fluid-typography/)
- **MDN Web Docs**: [Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)
- **FitText.js**: Concept verification for JS-based resizing.

## Design Implementation

- **Visual Style**: Clean, readable sans-serif typography.
- **Color**: White to Slate-400 gradient (existing).

## Approach Choices

1.  **CSS Container Queries**: `container-type: size` + `cqw` units.
    - _Pros_: Pure CSS, modern.
    - _Cons_: Browser support (though good), can be tricky with text wrapping.
2.  **JavaScript / Character Count (Selected)**:
    - _Pros_: Predictable, easy to implement in React, no external deps.
    - _Cons_: "Magic numbers" for breakpoints.

**Selected Approach**: Character count breakpoints. It provides discrete steps that are easy to design for, avoiding "in-between" sizes that might look awkward with line heights.

## Logic

```javascript
const getFontSize = (text: string) => {
  const len = text.length;
  if (len > 200) return "text-lg md:text-xl";
  if (len > 100) return "text-xl md:text-2xl";
  if (len > 50) return "text-2xl md:text-3xl";
  return "text-3xl md:text-4xl"; // Default
};
```

## Considerations

- **Line Height**: Tighter line height for smaller text to fit more content.
- **Overflow**: Even with smaller text, extremely long questions might need a rudimentary scrollbar or specialized truncation, though unlikely for this use case.
