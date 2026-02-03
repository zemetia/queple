"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from "framer-motion";
import {
  MessageCircle,
  RefreshCw,
  Heart,
  ArrowUp,
  Settings,
  X,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Question } from "../types/game";
import { recordInteraction } from "./actions/game";
import { useAuth } from "@/components/AuthProvider";
import { LevelRangeSelector } from "@/components/LevelRangeSelector";

// --- Components ---

const cardVariants = {
  enter: { scale: 0.95, y: -20, opacity: 0 },
  center: { zIndex: 1, scale: 1, y: 0, opacity: 1 },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? -1000 : 1000,
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.4 },
  }),
};

/**
 * Pattern Background Component
 * Uses the game patterns in a subtle, minimalist way.
 */
const PatternBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-slate-50">
    {/* Subtle Grid / Texture Base */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

    {/* Floating Patterns - Low Opacity */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.03 }}
      transition={{ duration: 1 }}
      className="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-[url('/patterns/male.png')] bg-contain bg-no-repeat rotate-[-12deg] grayscale"
    />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.03 }}
      transition={{ duration: 1, delay: 0.2 }}
      className="absolute bottom-[-5%] right-[-10%] w-[60vh] h-[60vh] bg-[url('/patterns/female.png')] bg-contain bg-no-repeat rotate-[15deg] grayscale"
    />
    <div className="absolute top-[40%] left-[60%] w-[30vh] h-[30vh] bg-[url('/patterns/neutral.png')] bg-contain bg-no-repeat rotate-[45deg] opacity-[0.02] grayscale" />
  </div>
);

const Card = ({
  question,
  index,
  total,
  onSwipe,
  custom,
}: {
  question: Question;
  index: number;
  total: number;
  onSwipe: (direction: "left" | "right", isFlipped: boolean) => void;
  custom: number;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.x > 100) {
      onSwipe("right", isFlipped);
    } else if (info.offset.x < -100) {
      onSwipe("left", isFlipped);
    }
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const gender = (question.forGender || "BOTH")?.toUpperCase();

  // Dynamic Styles based on Gender/Type
  const getCardStyles = () => {
    if (gender === "MALE") {
      return {
        bg: "bg-white bg-[url('/patterns/male.png')] bg-cover bg-center",
        border: "border-slate-200",
        text: "text-slate-800",
        tag: "bg-slate-100 text-slate-600",
        highlight: "from-slate-700 to-slate-500",
      };
    }
    if (gender === "FEMALE") {
      return {
        bg: "bg-white bg-[url('/patterns/female.png')] bg-cover bg-center",
        border: "border-slate-200",
        text: "text-slate-800",
        tag: "bg-slate-100 text-slate-600",
        highlight: "from-slate-700 to-slate-500",
      };
    }
    return {
      bg: "bg-white bg-[url('/patterns/neutral.png')] bg-cover bg-center",
      border: "border-slate-200",
      text: "text-slate-800",
      tag: "bg-slate-100 text-slate-600",
      highlight: "from-slate-700 to-slate-500",
    };
  };

  const styles = getCardStyles();

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        zIndex: total - index,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute w-full max-w-xs aspect-[3/4] cursor-grab active:cursor-grabbing perspective-1500"
      onClick={handleCardClick}
      variants={cardVariants}
      custom={custom}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <motion.div
        className={`relative w-full h-full transform-style-3d shadow-xl rounded-3xl transition-all duration-500`}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {/* --- FRONT OF CARD --- */}
        <div
          className={`absolute inset-0 backface-hidden rounded-3xl overflow-hidden border ${styles.border} ${styles.bg} ${styles.text} flex flex-col items-center justify-between p-8`}
        >
          {/* Background Pattern Hint */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat" />

          {/* Stats Header */}
          <div className="absolute top-6 right-6 flex gap-3 z-10">
            <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded-full backdrop-blur-sm border border-slate-100 shadow-sm">
              <ArrowUp size={14} className="text-slate-600" />
              <span className="text-xs font-bold text-slate-700">
                {question.upvotes || 0}
              </span>
            </div>
          </div>

          <div className="mt-12 text-center w-full relative z-10">
            <span
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border border-slate-100 bg-white/90 backdrop-blur-sm text-slate-600`}
            >
              {question.topic?.name || question.category?.name || "Topic"}
            </span>
            <div className="flex items-center justify-center gap-2 mt-4 text-xs opacity-60 font-medium uppercase tracking-wider text-slate-700">
              <Zap
                size={12}
                className={
                  question.level > 5 ? "text-amber-500" : "text-slate-400"
                }
              />
              Level {question.level}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full text-center relative z-10">
            <h2
              className={`text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r ${styles.highlight} mb-2 tracking-tight`}
            >
              Queple
            </h2>
            <p className="text-xs font-semibold opacity-40 uppercase tracking-[0.2em] animate-pulse text-slate-800">
              Tap to Reveal
            </p>
          </div>

          <div className="w-full flex justify-between items-end opacity-40 text-[10px] font-mono font-bold uppercase relative z-10 text-slate-700">
            <span>#{question.id.substring(0, 4)}</span>
            <div className="flex gap-2">
              {question.is18Plus && (
                <span className="text-red-500 font-extrabold">18+</span>
              )}
              <span>{question.forGender}</span>
            </div>
          </div>
        </div>

        {/* --- BACK OF CARD --- */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl overflow-hidden bg-white border border-slate-200 flex flex-col items-center justify-center p-8 text-center shadow-lg">
          {/* Abstract Decoration - Light */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-80" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-80" />

          <div className="absolute top-6 left-6 opacity-30">
            <MessageCircle size={24} className="text-slate-400" />
          </div>

          <div className="flex-1 flex items-center justify-center w-full z-10 overflow-y-auto max-h-full py-4 scrollbar-hide">
            <p className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed font-serif">
              "{question.content}"
            </p>
          </div>

          <div className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Swipe Left • Right
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Settings Type ---
type GameSettings = {
  levelRange: { min: number; max: number };
  mode: "zigzag" | "all_both" | "zigzag_both";
  allow18Plus: boolean;
};

// --- Main Page Component ---
export default function GamePage() {
  const { user, signIn, logout } = useAuth();
  const [cards, setCards] = useState<Question[]>([]);
  const [swipedCards, setSwipedCards] = useState<Question[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [exitDirection, setExitDirection] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<GameSettings>({
    levelRange: { min: 1, max: 3 },
    mode: "zigzag",
    allow18Plus: false,
  });

  const startTimeRef = useRef<number>(0);

  // Fetch Questions Function
  const fetchQuestions = async (isInitial = false) => {
    if (loading) return; // Prevent double trigger
    setLoading(true);
    try {
      // Collect IDs to exclude: Swiped ones + Current ones in hand
      const currentIds = cards.map((c) => c.id);
      const swipedIds = swipedCards.map((c) => c.id);
      const excludeIds = [...swipedIds, ...currentIds];

      const response = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: settings.mode,
          minLevel: settings.levelRange.min,
          maxLevel: settings.levelRange.max,
          allow18Plus: settings.allow18Plus,
          firebaseUid: user?.uid,
          excludeIds: excludeIds.slice(-50), // optimization: keep payload reasonable but sufficient
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch questions");

      const data = await response.json();
      if (Array.isArray(data)) {
        if (isInitial) {
          setCards(data);
        } else {
          setCards((prev) => [...prev, ...data]);
        }
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial Fetch on Start
  useEffect(() => {
    if (gameStarted && cards.length === 0) {
      fetchQuestions(true);
    }
  }, [gameStarted]);

  // Queue more when running low (< 3 cards left)
  useEffect(() => {
    if (gameStarted && cards.length > 0 && cards.length <= 2 && !loading) {
      console.log("Auto-refill: Low cards detected");
      fetchQuestions(false);
    }
  }, [cards.length, gameStarted]);

  // Set start time when a new card becomes active (index 0)
  useEffect(() => {
    if (cards.length > 0 && gameStarted) {
      startTimeRef.current = Date.now();
    }
  }, [cards.length, gameStarted]);

  const handleAction = async (
    reaction: "UPVOTE" | "DOWNVOTE" | "SKIP",
    directionValue: number,
    isCardFlipped: boolean,
  ) => {
    if (cards.length === 0) return;

    setExitDirection(directionValue);

    const currentCard = cards[0];
    const endTime = Date.now();
    const duration = (endTime - startTimeRef.current) / 1000; // in seconds

    // Record interaction in the background
    recordInteraction(currentCard.id, reaction, duration).catch((err) =>
      console.error("Failed to record stats", err),
    );

    // Proceed to next card
    setSwipedCards((prev) => [...prev, currentCard]);
    setCards((prev) => prev.slice(1));
  };

  const handleSwipe = (direction: "left" | "right", isCardFlipped: boolean) => {
    let reaction: "UPVOTE" | "DOWNVOTE" | "SKIP";

    if (!isCardFlipped) {
      reaction = "SKIP";
    } else {
      reaction = direction === "right" ? "UPVOTE" : "DOWNVOTE";
    }

    const directionValue = direction === "right" ? 1 : -1;
    handleAction(reaction, directionValue, isCardFlipped);
  };

  const SettingsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-sm border border-slate-100 shadow-2xl relative overflow-hidden"
      >
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Settings className="w-4 h-4 text-slate-400" />
            Preferences
          </h3>
          <button
            onClick={() => setShowSettings(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8 relative z-10">
          {/* Level Range Selector */}
          <LevelRangeSelector
            min={settings.levelRange.min}
            max={settings.levelRange.max}
            onChange={(range) =>
              setSettings((s) => ({ ...s, levelRange: range }))
            }
          />

          {/* Game Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
              Deck Type
            </label>
            <div className="flex flex-col gap-2">
              {[
                {
                  id: "zigzag",
                  label: "Standard",
                  desc: "Balanced mix",
                },
                {
                  id: "zigzag_both",
                  label: "Dynamic",
                  desc: "Includes couples questions",
                },
                {
                  id: "all_both",
                  label: "Couples",
                  desc: "Focused on relationship",
                },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() =>
                    setSettings((s) => ({ ...s, mode: mode.id as any }))
                  }
                  className={`w-full py-3 px-4 rounded-xl text-left transition-all border flex items-center justify-between group ${
                    settings.mode === mode.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-transparent text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${settings.mode === mode.id ? "bg-white" : "bg-slate-300"}`}
                    />
                    <div>
                      <div className="font-bold text-sm leading-tight">
                        {mode.label}
                      </div>
                      <div className="text-[10px] opacity-70 leading-tight">
                        {mode.desc}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 18+ Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-sm">
                Allow Mature Content
              </span>
              <span className="text-[10px] text-slate-400">
                Include 18+ questions in deck
              </span>
            </div>
            <button
              onClick={() =>
                setSettings((s) => ({ ...s, allow18Plus: !s.allow18Plus }))
              }
              className={`w-11 h-6 rounded-full transition-colors relative ${settings.allow18Plus ? "bg-slate-900" : "bg-slate-200"}`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${settings.allow18Plus ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setShowSettings(false);
            if (gameStarted) fetchQuestions(true);
          }}
          className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-bold text-base hover:scale-[1.01] transition-transform active:scale-[0.98] shadow-xl shadow-slate-200"
        >
          Apply Changes
        </button>
      </motion.div>
    </div>
  );

  // --- Start Screen ---
  if (!gameStarted) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 text-slate-900">
        <PatternBackground />

        {showSettings && <SettingsModal />}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 text-center flex flex-col items-center gap-10 p-6 max-w-md w-full"
        >
          {/* Main Logo Area */}
          <div className="flex flex-col items-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-slate-200 blur-2xl opacity-50 rounded-full" />
              <div className="relative w-24 h-24 bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 flex items-center justify-center border border-slate-100">
                <Sparkles
                  className="text-slate-800 w-10 h-10"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-3">
              Queple.
            </h1>
            <p className="text-base text-slate-500 font-medium max-w-[260px] leading-relaxed">
              Curated questions for meaningful conversations.
            </p>
          </div>

          <div className="w-full space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGameStarted(true)}
              className="group relative w-full py-4 px-8 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-3 overflow-hidden transition-all"
            >
              Start Playing
              <ArrowUp
                className="rotate-90 opacity-60 group-hover:translate-x-1 transition-transform"
                size={18}
              />
            </motion.button>

            <button
              onClick={() => setShowSettings(true)}
              className="w-full py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Settings size={16} />
              Preferences
            </button>
          </div>

          {/* Auth Section */}
          <div className="w-full pt-6">
            {!user ? (
              <button
                onClick={signIn}
                className="w-full py-3 rounded-xl hover:bg-white/50 transition-colors text-xs font-semibold text-slate-500 flex items-center justify-center gap-2 group"
              >
                <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                  Login to track progress
                </span>
              </button>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-slate-400 font-medium">
                  Hi, <span className="text-slate-900">{user.displayName}</span>
                </p>
                <button
                  onClick={logout}
                  className="text-[10px] text-slate-400 underline hover:text-slate-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] text-slate-300 uppercase">
            Designed for connection
          </p>
        </div>
      </div>
    );
  }

  // --- Game Loop Screen ---
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 relative overflow-hidden text-slate-900">
      <PatternBackground />
      {showSettings && <SettingsModal />}

      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center z-10 relative">
        <div
          className="flex items-center gap-2"
          onClick={() => setGameStarted(false)}
        >
          <h2 className="text-lg font-black tracking-tight text-slate-900 cursor-pointer">
            Queple.
          </h2>
          {settings.allow18Plus && (
            <span className="w-2 h-2 rounded-full bg-red-500" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-xs font-bold text-slate-600 border border-white/20">
            {cards.length}
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 bg-white/50 backdrop-blur-md rounded-full hover:bg-white transition-colors border border-white/20"
          >
            <Settings size={18} className="text-slate-700" />
          </button>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative w-full overflow-hidden">
        <div className="relative w-full max-w-xs aspect-[3/4] z-10 flex items-center justify-center">
          {loading && cards.length === 0 ? (
            <div className="flex flex-col items-center gap-4 text-slate-400 animate-pulse">
              <Loader2 size={32} className="animate-spin" />
              <p className="font-medium text-xs tracking-widest uppercase">
                Loading
              </p>
            </div>
          ) : (
            <AnimatePresence custom={exitDirection}>
              {cards.length > 0 ? (
                cards
                  .slice(0, 2)
                  .map((question, index) => (
                    <Card
                      key={question.id}
                      question={question}
                      index={index}
                      total={cards.length}
                      onSwipe={handleSwipe}
                      custom={exitDirection}
                    />
                  ))
                  .reverse()
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full p-8 bg-white rounded-[2rem] text-center shadow-2xl flex flex-col items-center gap-6 border border-slate-100"
                >
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <Heart size={24} className="text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      All Done
                    </h3>
                    <p className="text-slate-500 text-sm">
                      Hope you had good conversations.
                    </p>
                  </div>
                  <div className="w-full space-y-3">
                    <button
                      onClick={() => fetchQuestions(false)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors hover:scale-[1.02]"
                    >
                      <RefreshCw size={16} />
                      Draw More
                    </button>
                    <button
                      onClick={() => setGameStarted(false)}
                      className="w-full py-3 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Back to Menu
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      <div className="p-8 text-center opacity-30 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
        Swipe Right • Like
      </div>
    </div>
  );
}
