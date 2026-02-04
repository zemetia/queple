import React, { useState } from "react";
import { motion } from "framer-motion";

interface LevelRangeSelectorProps {
  min: number;
  max: number;
  onChange: (range: { min: number; max: number }) => void;
}

export const LevelRangeSelector: React.FC<LevelRangeSelectorProps> = ({
  min,
  max,
  onChange,
}) => {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const levels = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleLevelClick = (level: number) => {
    if (min !== max) {
      // If a range is already selected (start !== end), reset to the clicked level
      // This mimics "picking a new start date" behavior
      onChange({ min: level, max: level });
    } else {
      // If a single level is selected (min === max), complete the range
      if (level < min) {
        onChange({ min: level, max: min });
      } else {
        onChange({ min, max: level });
      }
    }
  };

  // Determine the range to visualize (including hover preview)
  let displayMin = min;
  let displayMax = max;

  // Only show preview if we are in "Extension Mode" (currently single selection)
  if (min === max && hoveredLevel !== null) {
    displayMin = Math.min(min, hoveredLevel);
    displayMax = Math.max(min, hoveredLevel);
  }

  return (
    <div className="w-full" onMouseLeave={() => setHoveredLevel(null)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
          Intensity
        </span>
        <span className="text-xs font-medium text-slate-400">
          {min === max ? `Level ${min}` : `Level ${min} - ${max}`}
        </span>
      </div>
      <div className="relative flex justify-between items-center bg-slate-100 rounded-xl p-1 h-12">
        {/* Active Range Highlight Background */}
        <motion.div
          className="absolute top-1 bottom-1 bg-white shadow-sm rounded-lg border border-slate-200"
          initial={false}
          animate={{
            left: `${((displayMin - 1) / 10) * 100}%`,
            right: `${100 - (displayMax / 10) * 100}%`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        {levels.map((level) => {
          // Check against displayMin/Max so text color updates during hover preview
          const isActive = level >= displayMin && level <= displayMax;
          const isBound = level === displayMin || level === displayMax;

          return (
            <button
              key={level}
              onClick={() => handleLevelClick(level)}
              onMouseEnter={() => setHoveredLevel(level)}
              className={`relative z-10 w-full h-full flex items-center justify-center text-sm font-medium transition-colors rounded-lg ${
                isActive
                  ? "text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              } ${isBound ? "font-bold" : ""}`}
            >
              {level}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[10px] text-slate-400">Light</span>
        <span className="text-[10px] text-slate-400">Deep</span>
      </div>
    </div>
  );
};
