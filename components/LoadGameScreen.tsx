import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { GameState, AttachmentType, Difficulty, WeaponType } from '@/types';
import { CHAPTERS, WEAPONS_DATA } from '@/constants';

// Build the set of weapons unlocked up to (and including) a given chapter id
const getUnlockedWeapons = (upToChapterId: number) => {
  const unlocked = new Set<WeaponType>([WeaponType.KNIFE]); // always have knife
  CHAPTERS.filter(c => c.id <= upToChapterId).forEach(c => {
    if ((c as any).unlocks) unlocked.add((c as any).unlocks as WeaponType);
  });
  return Array.from(unlocked).map(t => ({ ...WEAPONS_DATA[t], attachments: [] }));
};

const LoadGameScreen = ({ state, dispatch }: { state: GameState, dispatch: any }) => {
  const [saves, setSaves] = useState<any[]>([]);

  useEffect(() => {
    try {
      const storedSaves = localStorage.getItem('primal_fracture_saves');
      let parsed = storedSaves ? JSON.parse(storedSaves) : [];
      
      const manualSave = localStorage.getItem('primal_fracture_save_folder');
      if (manualSave) {
        const parsedManual = JSON.parse(manualSave);
        parsed = [parsedManual, ...parsed];
      }
      
      if (state.isTestRun) {
        // One simulated save per chapter — loadout matches what's unlocked by that chapter
        const simulatedSaves = CHAPTERS.map(chapter => ({
          timestamp: Date.now() - chapter.id * 1000,
          chapter: chapter.id,
          state: {
            health: 200, maxHealth: 200, medikits: 5,
            weapons: getUnlockedWeapons(chapter.id),
            availableAttachments: [AttachmentType.SCOPE, AttachmentType.SILENCER, AttachmentType.EXTENDED_MAG],
            currentAct: chapter.act, currentChapter: chapter.id,
            difficulty: Difficulty.STANDARD
          }
        }));
        const merged = [...parsed];
        simulatedSaves.forEach(sim => {
          if (!merged.find((s: any) => s.chapter === sim.chapter)) merged.push(sim);
        });
        setSaves(merged);
      } else {
        setSaves(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error("Failed to load saves", e);
      setSaves([]);
    }
  }, [state.isTestRun]);

  const handleLoadSave = (save: any) => {
    const chapter = CHAPTERS.find(c => c.id === save.chapter);
    if (!chapter) return;

    dispatch((prev: GameState) => ({
      ...prev,
      // ── Restore saved state ──────────────────────────────
      health:       save.state.health       ?? prev.health,
      maxHealth:    save.state.maxHealth    ?? prev.maxHealth,
      medikits:     save.state.medikits     ?? 0,
      weapons:      save.state.weapons      ?? prev.weapons,
      availableAttachments: save.state.availableAttachments ?? [],
      difficulty:   save.state.difficulty   ?? prev.difficulty,
      // ── Jump to the EXACT saved chapter ─────────────────
      currentChapter: chapter.id,
      currentAct:     chapter.act,
      totalEnemiesInLevel: save.state.totalEnemiesInLevel ?? chapter.enemyCount,
      // ── Reset per-chapter counters ───────────────────────
      enemiesKilled:          0,
      isZoneCompleted:        false,
      showZoneCompletionPrompt: false,
      isReloading:            false,
      isHealing:              false,
      killStreak:             0,
      // ── Boot into gameplay ───────────────────────────────
      gameStarted: true,
      isPaused:    false,
      isGameOver:  false,
      showStory:   true,   // show the chapter briefing for this chapter
      isLocked:    false,  // pointer lock will engage on first click
      showLoadGame: false,
    }));
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
      className="relative z-10 w-full max-w-2xl bg-black/90 backdrop-blur-xl border border-white/10 flex flex-col pointer-events-auto"
      style={{ maxHeight: '85vh' }}
    >
      {/* Sticky header */}
      <div className="flex-shrink-0 px-10 pt-10 pb-4 border-b border-white/10">
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Load Mission Save</h2>
        <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-1">{saves.length} save{saves.length !== 1 ? 's' : ''} found</p>
      </div>
      
      {/* Scrollable save list */}
      <div
        className="flex-1 overflow-y-auto px-10 py-4 space-y-3"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(220,38,38,0.6) rgba(255,255,255,0.05)',
        }}
      >
        {saves.length === 0 ? (
          <div className="text-white/20 text-center py-12 font-bold uppercase tracking-widest italic">No Saves Found</div>
        ) : (
          saves.sort((a, b) => b.timestamp - a.timestamp).map((save, idx) => {
            const chap = CHAPTERS.find(c => c.id === save.chapter);
            return (
              <button key={`${save.timestamp}-${idx}`} onClick={() => handleLoadSave(save)}
                className="w-full bg-white/5 border border-white/10 p-5 flex justify-between items-center group hover:bg-red-600/20 hover:border-red-500/50 transition-all text-left"
              >
                <div>
                  <div className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">
                    Act {chap?.act ?? '?'} &mdash; Chapter {save.chapter}
                  </div>
                  <div className="text-white text-lg font-black uppercase italic leading-tight">
                    {chap?.title || 'Unknown Sector'}
                  </div>
                  <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {chap?.location || ''} &bull; {new Date(save.timestamp).toLocaleString()}
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-red-500 transition-colors flex-shrink-0 ml-4" />
              </button>
            );
          })
        )}
      </div>

      {/* Sticky footer */}
      <div className="flex-shrink-0 px-10 py-6 border-t border-white/10 flex gap-4 items-center">
        <button onClick={() => dispatch((prev: GameState) => ({ ...prev, showLoadGame: false }))}
          className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-sm hover:bg-red-500 hover:text-white transition-colors"
        >← Back</button>
        {saves.length > 0 && (
          <button onClick={() => {
            if (confirm('Delete ALL save files? This cannot be undone.')) {
              localStorage.removeItem('primal_fracture_saves');
              localStorage.removeItem('primal_fracture_save_folder');
              setSaves([]);
            }
          }}
            className="px-8 py-3 bg-red-900/30 text-red-400 font-black uppercase tracking-widest rounded-sm hover:bg-red-600 hover:text-white transition-colors border border-red-500/30"
          >Clear All</button>
        )}
      </div>
    </motion.div>
  );
};

export default LoadGameScreen;
