import React from 'react';
import { motion } from 'motion/react';
import { Heart, Crosshair } from 'lucide-react';
import { GameState, AttachmentType } from '@/types';
import { ATTACHMENTS_DATA } from '@/constants';
import { cn } from '@/lib/utils';

const InventoryScreen = ({ state, dispatch }: { state: GameState, dispatch: any }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-12"
    >
      <div className="max-w-6xl w-full h-full flex flex-col gap-12">
        <div className="flex justify-between items-end border-b border-white/10 pb-8">
          <div>
            <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter">Tactical Inventory</h2>
            <p className="text-white/40 uppercase tracking-widest font-bold text-sm">Marcus Vael // Field Equipment</p>
          </div>
          <button 
            onClick={() => dispatch((prev: any) => ({ ...prev, isInventoryOpen: false }))}
            className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-sm hover:bg-red-500 hover:text-white transition-colors"
          >Close [I]</button>
        </div>

        <div className="grid grid-cols-3 gap-8 flex-1 overflow-y-auto pr-4">
          <div className="col-span-2 space-y-6">
            <h3 className="text-xl font-black text-red-500 uppercase tracking-widest">Primary & Secondary Weapons</h3>
            <div className="grid grid-cols-1 gap-4">
              {state.weapons.length === 0 && (
                <div className="p-12 border border-dashed border-white/10 rounded-xl text-center">
                  <p className="text-white/20 uppercase tracking-widest font-black">No weapons equipped</p>
                </div>
              )}
              {state.weapons.map((weapon, idx) => (
                <div key={`inventory-weapon-${weapon.type}-${idx}`}
                  className={cn("p-6 border rounded-xl transition-all",
                    state.currentWeaponIndex === idx ? "bg-white/10 border-white/40 scale-[1.02]" : "bg-white/5 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Slot {idx + 1}</div>
                      <h4 className="text-2xl font-black text-white uppercase">{weapon.name}</h4>
                    </div>
                    {state.currentWeaponIndex === idx && (
                      <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Equipped</span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm mb-6 leading-relaxed">{weapon.description}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/40 p-3 rounded-lg">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Ammo</div>
                      <div className="text-xl font-black text-white">{weapon.ammo} / {weapon.reserve}</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Damage</div>
                      <div className="text-xl font-black text-white">{weapon.damage}</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Fire Rate</div>
                      <div className="text-xl font-black text-white">{weapon.fireRate}s</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Reload</div>
                      <div className="text-xl font-black text-white">{weapon.reloadTime}s</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => dispatch((prev: any) => ({ ...prev, currentWeaponIndex: idx }))}
                    disabled={state.currentWeaponIndex === idx}
                    className="w-full mt-6 py-3 border border-white/10 rounded-lg text-white font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white transition-all"
                  >Select Weapon</button>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-white/5 border border-white/10 p-6 rounded-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-blue-500 uppercase tracking-widest">Weapon Attachments</h3>
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Managing: <span className="text-white">{state.weapons[state.currentWeaponIndex]?.name}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {state.availableAttachments.length === 0 && (
                  <div className="col-span-2 p-8 border border-dashed border-white/10 rounded-xl text-center">
                    <p className="text-white/20 uppercase tracking-widest font-black">No attachments acquired</p>
                  </div>
                )}
                {state.availableAttachments.map((att, idx) => {
                  const currentWeapon = state.weapons[state.currentWeaponIndex];
                  const isEquipped = currentWeapon?.attachments.includes(att);
                  const attData = ATTACHMENTS_DATA[att];
                  return (
                    <button key={`${att}-${idx}`}
                      onClick={() => {
                        dispatch((prev: GameState) => {
                          const newWeapons = [...prev.weapons];
                          const weapon = { ...newWeapons[prev.currentWeaponIndex] };
                          if (weapon.attachments.includes(att)) {
                            weapon.attachments = weapon.attachments.filter(a => a !== att);
                          } else {
                            weapon.attachments = [...weapon.attachments, att];
                          }
                          newWeapons[prev.currentWeaponIndex] = weapon;
                          return { ...prev, weapons: newWeapons };
                        });
                      }}
                      className={cn("p-4 border rounded-xl text-left transition-all group relative overflow-hidden",
                        isEquipped ? "bg-blue-500/20 border-blue-500" : "bg-white/5 border-white/10 hover:border-white/30"
                      )}
                    >
                      <div className="relative z-10">
                        <div className="font-bold text-white uppercase flex justify-between">
                          {attData.name}
                          {isEquipped && <Crosshair className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div className="text-xs text-white/60 mt-1">{attData.description}</div>
                        <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-blue-400">
                          {isEquipped ? "[ Equipped ]" : "[ Equip ]"}
                        </div>
                      </div>
                      {isEquipped && <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-blue-500 uppercase tracking-widest">Survival Gear</h3>
            <div className="bg-white/5 border border-white/5 p-8 rounded-xl space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <Heart className="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Health Status</div>
                  <div className="text-4xl font-black text-white">{state.health} / {state.maxHealth} <span className="text-xl text-white/40">HP</span></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Medikits</div>
                    <div className="text-3xl font-black text-white">{state.medikits} Units</div>
                  </div>
                  <button 
                    onClick={() => {
                      if (state.medikits > 0 && state.health < state.maxHealth) {
                        dispatch((prev: any) => ({ ...prev, health: Math.min(prev.maxHealth, prev.health + 199), medikits: prev.medikits - 1 }));
                      }
                    }}
                    disabled={state.medikits === 0 || state.health >= state.maxHealth}
                    className="px-6 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
                  >Use [H]</button>
                </div>
                <p className="text-white/40 text-[10px] leading-relaxed">Field medical kit. Restores HP to full on use.</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-8 rounded-xl">
              <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Mission Intel</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Current Act</span>
                  <span className="text-white font-bold">{state.currentAct}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Chapter</span>
                  <span className="text-white font-bold">{state.currentChapter}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Hostiles Eliminated</span>
                  <span className="text-white font-bold text-red-500">{state.enemiesKilled}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryScreen;
