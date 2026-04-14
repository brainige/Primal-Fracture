import React from 'react';
import { motion } from 'motion/react';
import { GameState } from '@/types';
import { WEAPONS_DATA } from '@/constants';

const WeaponStatsScreen = ({ state: _state, dispatch }: { state: GameState, dispatch: any }) => {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
      className="relative z-10 w-full max-w-4xl h-[80vh] bg-black/90 backdrop-blur-xl p-12 border border-white/10 flex flex-col pointer-events-auto"
    >
      <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-8 border-b border-white/10 pb-4">Weapon Arsenal</h2>
      
      <div className="flex-1 overflow-y-auto pr-4 space-y-8 custom-scrollbar">
        {Object.values(WEAPONS_DATA).map((weapon) => (
          <div key={weapon.type} className="bg-white/5 border border-white/10 p-8 rounded-sm flex gap-8">
            <div className="w-48 h-32 bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
              <div className="text-white/20 font-black uppercase tracking-tighter text-4xl italic">{weapon.type}</div>
            </div>
            <div className="space-y-4 text-left flex-1">
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
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Fire Rate</div>
                  <div className="text-white font-black">{weapon.fireRate}s</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => dispatch((prev: GameState) => ({ ...prev, showWeaponStats: false }))}
        className="mt-8 self-start px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-sm hover:bg-red-500 hover:text-white transition-colors"
      >Back to Pause Menu</button>
    </motion.div>
  );
};

export default WeaponStatsScreen;
