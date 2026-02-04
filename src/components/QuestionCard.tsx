"use client";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, MessageSquareMore } from "lucide-react";
import { TextFit } from "@/components/TextFit";

interface Question {
  id: string;
  content: string;
  level: number;
}

interface QuestionCardProps {
  question: Question;
  onReact: (type: "UPVOTE" | "DOWNVOTE" | "SKIP") => void;
}

export function QuestionCard({ question, onReact }: QuestionCardProps) {
  return (
    <motion.div
      key={question.id}
      initial={{ scale: 0.95, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 1.05, opacity: 0, y: -50 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="card glass w-full max-w-lg mx-auto min-h-[420px] flex flex-col justify-between p-8 relative overflow-hidden group"
    >
      {/* Decorative gradient blob */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/30 transition-all duration-700 pointer-events-none" />

      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Level {question.level}
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10 w-full h-full overflow-hidden p-4">
        <TextFit
          mode="multi"
          min={16}
          max={48}
          className="font-extrabold leading-tight text-center text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 w-full h-full flex items-center justify-center"
        >
          {question.content}
        </TextFit>
      </div>

      <div className="flex justify-center gap-6 mt-10 relative z-10">
        <button
          onClick={() => onReact("DOWNVOTE")}
          className="btn glass rounded-full w-14 h-14 p-0 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-400 transition-all active:scale-95"
          aria-label="Dislike"
        >
          <ThumbsDown size={22} strokeWidth={2.5} />
        </button>

        <button
          onClick={() => onReact("SKIP")}
          className="btn glass px-6 rounded-full text-sm font-semibold hover:bg-slate-700/50 active:scale-95 border-dashed"
        >
          Skip
        </button>

        <button
          onClick={() => onReact("UPVOTE")}
          className="btn rounded-full w-14 h-14 p-0 bg-primary text-white hover:bg-[#7c3aed] shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_rgba(139,92,246,0.7)] transition-all active:scale-95 active:shadow-none"
          aria-label="Like"
        >
          <ThumbsUp size={22} strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  );
}
