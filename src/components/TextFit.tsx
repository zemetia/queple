"use client";

import { useRef, useState, useLayoutEffect } from "react";

interface TextFitProps {
  children: React.ReactNode;
  className?: string;
  min?: number;
  max?: number;
  mode?: "single" | "multi";
}

export function TextFit({
  children,
  className = "",
  min = 16,
  max = 100,
  mode = "multi",
}: TextFitProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(max);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !el.parentElement) return;

    const calculate = () => {
      // Reset to max to start calculation from clean slate if needed,
      // or effectively we just check current constraints.
      // Important: we must allow the element to potentially overflow to measure 'scrollHeight' vs 'clientHeight' accurately if we were shrinking.
      // But for binary search we test specific sizes.

      const checkFit = (size: number) => {
        el.style.fontSize = `${size}px`;
        if (mode === "single") {
          return el.scrollWidth <= el.clientWidth;
        } else {
          return el.scrollHeight <= el.clientHeight;
        }
      };

      // Binary search
      let low = min;
      let high = max;
      let best = min;

      // Optimization: Try current max first
      if (checkFit(max)) {
        best = max;
      } else {
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (checkFit(mid)) {
            best = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
      }

      setFontSize(best);
      el.style.fontSize = `${best}px`;
      setReady(true);
    };

    // Initial calculation
    calculate();

    // Re-calculate on resize
    const observer = new ResizeObserver(() => {
      calculate();
    });

    observer.observe(el.parentElement);

    return () => observer.disconnect();
  }, [children, min, max, mode, className]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        fontSize: `${fontSize}px`,
        opacity: ready ? 1 : 0,
        transition: "opacity 0.2s ease-in",
      }}
    >
      {children}
    </div>
  );
}
