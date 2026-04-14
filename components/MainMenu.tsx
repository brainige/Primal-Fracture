import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Crosshair, ChevronRight } from 'lucide-react';
import { GameState, AttachmentType, Difficulty } from '@/types';
import { CHAPTERS, WEAPONS_DATA } from '@/constants';
import SettingsMenu from '@/components/SettingsMenu';

const MainMenu = ({ onStart, state, dispatch, onTestRun }: { onStart: () => void, state: GameState, dispatch: any, onTestRun: () => void }) => {
  const [activeTab, setActiveTab] = useState<'main' | 'settings' | 'intelligence' | 'weapons' | 'load'>('main');
  const [saves, setSaves] = useState<any[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    try {
      const storedSaves = localStorage.getItem('primal_fracture_saves');
      let parsed = storedSaves ? JSON.parse(storedSaves) : [];
      
      if (state.isTestRun) {
        const simulatedSaves = CHAPTERS.map(chapter => ({
          timestamp: Date.now() - chapter.id * 1000,
          chapter: chapter.id,
          state: {
            health: 200, maxHealth: 200, medikits: 10,
            weapons: Object.values(WEAPONS_DATA),
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
  }, [activeTab, state.isTestRun]);

  const handleLoadSave = (save: any) => {
    dispatch((prev: GameState) => {
      let newState = {
        ...prev, ...save.state,
        enemiesKilled: 0, isReloading: false, isHealing: false,
        gameStarted: true, isPaused: false, isGameOver: false,
        showStory: true, isLocked: true, isTestRun: prev.isTestRun
      };
      if (prev.isTestRun) {
        newState.weapons = Object.values(WEAPONS_DATA).map(w => ({
          ...w, reserve: 999, ammo: w.maxAmmo,
          attachments: [AttachmentType.SCOPE, AttachmentType.SILENCER, AttachmentType.EXTENDED_MAG]
        }));
        newState.health = 200;
        newState.maxHealth = 200;
        newState.medikits = 10;
        newState.availableAttachments = [AttachmentType.SCOPE, AttachmentType.SILENCER, AttachmentType.EXTENDED_MAG];
      }
      return newState;
    });
  };

  const confirmDeleteAllSaves = () => {
    localStorage.removeItem('primal_fracture_saves');
    localStorage.removeItem('primal_fracture_save_folder');
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <img src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover grayscale" alt="Jungle" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'main' && (
          <motion.div key="main" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="relative z-10 text-center space-y-12">
            <div className="space-y-2">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-red-500 font-black tracking-[0.5em] uppercase text-xl">A Tactical Jungle Campaign</motion.div>
              <motion.h1 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="text-[12rem] font-black text-white tracking-tighter leading-none italic uppercase">Primal<br />Fracture</motion.h1>
            </div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col items-center gap-6">
              {state.isTestRun && (
                <div className="mb-4 p-4 bg-red-600/20 border border-red-500/50 rounded-sm w-full max-w-md">
                  <div className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-2">Test Run Active</div>
                  <button onClick={() => dispatch((prev: GameState) => ({ ...prev, isTestRun: false }))}
                    className="w-full py-2 bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-colors">Exit Test Run</button>
                </div>
              )}
              <div className="flex gap-4">
                <button onClick={onStart}
                  className="group relative px-12 py-6 bg-white text-black font-black uppercase tracking-[0.2em] text-xl rounded-sm overflow-hidden transition-all hover:scale-105 active:scale-95">
                  <div className="absolute inset-0 bg-red-600 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                  <span className="relative z-10 flex items-center gap-4 group-hover:text-white transition-colors"><Play className="w-6 h-6 fill-current" /> Begin Operation</span>
                </button>
                <button onClick={onTestRun}
                  className="group relative px-12 py-6 bg-white/10 text-white font-black uppercase tracking-[0.2em] text-xl rounded-sm overflow-hidden transition-all hover:scale-105 active:scale-95 border border-white/20">
                  <div className="absolute inset-0 bg-blue-600 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                  <span className="relative z-10 flex items-center gap-4 transition-colors"><Crosshair className="w-6 h-6" /> Test Run</span>
                </button>
              </div>
              
              <div className="flex gap-8 text-white/40 font-bold uppercase tracking-widest text-sm">
                <button onClick={() => setActiveTab('settings')} className="hover:text-white transition-colors cursor-pointer">Settings</button>
                <button onClick={() => setActiveTab('load')} className="hover:text-white transition-colors cursor-pointer">Load Game</button>
                <button onClick={() => setActiveTab('weapons')} className="hover:text-white transition-colors cursor-pointer">Weapons</button>
                <button onClick={() => setActiveTab('intelligence')} className="hover:text-white transition-colors cursor-pointer">Campaign Logs</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'load' && (
          <motion.div key="load" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="relative z-10 w-full max-w-2xl bg-black/80 backdrop-blur-md p-12 border border-white/10">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Load Game</h2>
              <div className="flex gap-4">
                {saves.length > 0 && (
                  <button onClick={() => setShowDeleteConfirmation(true)} className="text-red-500/60 hover:text-red-500 uppercase tracking-widest text-[10px] font-black transition-colors border border-red-500/20 px-3 py-1 hover:bg-red-500/10">
                    Delete All Progress
                  </button>
                )}
                {showDeleteConfirmation && (
                  <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-black border border-red-500/50 p-8 max-w-md w-full">
                      <h3 className="text-2xl font-black text-white uppercase italic mb-4">Confirm Deletion</h3>
                      <p className="text-white/60 mb-8">Are you sure you want to delete ALL saved progress? This cannot be undone.</p>
                      <div className="flex gap-4">
                        <button onClick={confirmDeleteAllSaves} className="flex-1 bg-red-600 text-white font-black uppercase py-3 hover:bg-red-700">Delete</button>
                        <button onClick={() => setShowDeleteConfirmation(false)} className="flex-1 bg-white/10 text-white font-black uppercase py-3 hover:bg-white/20">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
                <button onClick={() => setActiveTab('main')} className="text-white/40 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors">Back</button>
              </div>
            </div>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
              {saves.length === 0 ? (
                <div className="text-white/20 text-center py-12 font-bold uppercase tracking-widest italic">No Autosaves Found</div>
              ) : (
                saves.sort((a, b) => b.timestamp - a.timestamp).map((save, idx) => (
                  <button key={`${save.timestamp}-${idx}`} onClick={() => handleLoadSave(save)}
                    className="w-full bg-white/5 border border-white/10 p-6 flex justify-between items-center group hover:bg-red-600/20 hover:border-red-500/50 transition-all text-left">
                    <div>
                      <div className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">Chapter {save.chapter}</div>
                      <div className="text-white text-xl font-black uppercase italic">{CHAPTERS.find(c => c.id === save.chapter)?.title || 'Unknown Sector'}</div>
                      <div className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">{new Date(save.timestamp).toLocaleString()}</div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-red-500 transition-colors" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && <SettingsMenu state={state} dispatch={dispatch} onBack={() => setActiveTab('main')} />}

        {activeTab === 'weapons' && (
          <motion.div key="weapons" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="relative z-10 w-full max-w-4xl h-[80vh] bg-black/90 backdrop-blur-xl p-12 border border-white/10 flex flex-col">
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-8 border-b border-white/10 pb-4">Weapon Arsenal</h2>
            <div className="flex-1 overflow-y-auto pr-4 space-y-8 custom-scrollbar">
              {Object.values(WEAPONS_DATA).map((weapon) => (
                <div key={weapon.type} className="bg-white/5 border border-white/10 p-8 rounded-sm flex gap-8">
                  <div className="w-48 h-32 bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                    <div className="text-white/20 font-black uppercase tracking-tighter text-4xl italic">{weapon.type}</div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">{weapon.name}</h3>
                      <div className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest">Standard Issue</div>
                    </div>
                    <p className="text-white/60 font-mono text-sm leading-relaxed">{weapon.description}</p>
                    <div className="grid grid-cols-4 gap-6 pt-4">
                      <div>
                        <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Damage</div>
                        <div className="h-1 bg-white/10 w-full"><div className="h-full bg-red-500" style={{ width: `${weapon.damage}%` }} /></div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Range</div>
                        <div className="text-white font-black">{weapon.range}m</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Capacity</div>
                        <div className="text-white font-black">{weapon.maxAmmo} Rounds</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Reload Time</div>
                        <div className="text-white font-black">{weapon.reloadTime}s</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveTab('main')} className="mt-8 self-start px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-sm hover:bg-red-500 hover:text-white transition-colors">Back to Menu</button>
          </motion.div>
        )}

        {activeTab === 'intelligence' && (
          <motion.div key="intelligence" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="relative z-10 w-full max-w-4xl h-[80vh] bg-black/90 backdrop-blur-xl p-12 border border-white/10 flex flex-col">
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-8 border-b border-white/10 pb-4">Campaign Logs</h2>
            <div className="flex-1 overflow-y-auto pr-4 space-y-12 custom-scrollbar">
              {CHAPTERS.map((chapter) => (
                <div key={`chapter-select-${chapter.id}`} className="space-y-4">
                  <h3 className="text-2xl font-black text-red-500 uppercase tracking-widest">Act {chapter.act}: {chapter.title}</h3>
                  <div className="text-white/80 font-mono text-sm leading-relaxed whitespace-pre-wrap">{chapter.content}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveTab('main')} className="mt-8 self-start px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-sm hover:bg-red-500 hover:text-white transition-colors">Back to Menu</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-12 left-12 text-white/20 font-black uppercase tracking-widest text-xs">Marcus Vael // Korrath Archipelago // 2026</div>
    </div>
  );
};

export default MainMenu;
