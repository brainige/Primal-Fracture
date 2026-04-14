import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { PROLOGUE_TEXT } from '@/constants';

export const PrologueScreen = ({ onContinue }: { onContinue: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6"
    >
      <div className="max-w-3xl w-full flex flex-col gap-6" style={{ maxHeight: '95vh' }}>
        {/* Header */}
        <div className="flex-shrink-0 space-y-3">
          <div className="flex items-center gap-4 text-red-500 font-black tracking-widest uppercase text-sm">
            <div className="h-px flex-1 bg-red-500/30" />
            PROLOGUE
            <div className="h-px flex-1 bg-red-500/30" />
          </div>
          <h1 className="font-display text-6xl text-white tracking-wider text-center uppercase">
            Before the Islands
          </h1>
        </div>

        {/* Scrollable text block — never pushes button off screen */}
        <div className="flex-1 min-h-0 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl overflow-y-auto">
          <p className="font-narrative text-base text-white/80 leading-relaxed italic">
            {PROLOGUE_TEXT}
          </p>
        </div>

        {/* Continue — always visible */}
        <div className="flex-shrink-0 flex justify-center pb-2">
          <button
            onClick={onContinue}
            className="group relative px-12 py-5 bg-white text-black font-black uppercase tracking-widest text-lg rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-red-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">
              Continue <ChevronRight className="w-6 h-6" />
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const StoryScreen = ({ chapter, onContinue }: { chapter: any; onContinue: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6"
    >
      <div className="max-w-3xl w-full flex flex-col gap-6" style={{ maxHeight: '95vh' }}>
        {/* Header */}
        <div className="flex-shrink-0 space-y-3">
          <div className="flex items-center gap-4 text-red-500 font-black tracking-widest uppercase text-sm">
            <div className="h-px flex-1 bg-red-500/30" />
            Act {chapter.act} — Chapter {chapter.id}
            <div className="h-px flex-1 bg-red-500/30" />
          </div>
          <h1 className="font-display text-6xl text-white tracking-wider text-center uppercase">
            {chapter.title}
          </h1>
          <p className="text-center text-white/40 text-xs uppercase tracking-widest font-bold">
            {chapter.location}
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl overflow-y-auto">
          <p className="font-narrative text-base text-white/80 leading-relaxed italic">
            {chapter.content}
          </p>
          {chapter.unlocks && (
            <div className="mt-4 pt-4 border-t border-white/10 text-green-400 text-xs font-black uppercase tracking-widest text-center">
              ⬡ New Weapon Unlocked
            </div>
          )}
        </div>

        {/* Continue — always visible */}
        <div className="flex-shrink-0 flex justify-center pb-2">
          <button
            onClick={onContinue}
            className="group relative px-12 py-5 bg-white text-black font-black uppercase tracking-widest text-lg rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-red-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">
              Continue Mission <ChevronRight className="w-6 h-6" />
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
