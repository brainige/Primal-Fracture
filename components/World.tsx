import React, { useRef, useEffect, useMemo, useCallback, startTransition } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { WeaponType, AttachmentType } from '@/types';
import { CHAPTERS, WEAPONS_DATA, ATTACHMENTS_DATA } from '@/constants';
import { StaticEnvironment, isWaterArea, getTerrainType, getTerrainHeight, CharterBoat } from '@/components/Environment';
import Enemy from '@/components/Enemy';
import { Medikit, AmmoPickup, WeaponPickup, AttachmentPickup } from '@/components/Pickups';

// ─── EnemyWrapper ────────────────────────────────────────────────────────────
// Thin memoized bridge that binds enemy.id into the stable kill handler.
// Because onKilledLocal, onAttack, and onHit are stable (useCallback/ref-backed),
// and enemy object identity is stable within a chapter, this wrapper never
// re-renders due to parent state changes — eliminating the all-enemies re-render
// that previously caused the kill-spike lag.
const EnemyWrapper = React.memo(({
  enemy, onKilledLocal, onAttack, onHit,
  playerPos, structures, lastSoundTime, terrainType,
  sfxVolume, masterVolume, playerStealthLevel, difficulty
}: {
  enemy: { id: number; position: [number, number, number]; weaponType: WeaponType };
  onKilledLocal: (id: number, pos: [number, number, number], wType: WeaponType) => void;
  onAttack: (pos: [number, number, number], wType: WeaponType) => void;
  onHit: () => void;
  playerPos: React.MutableRefObject<THREE.Vector3>;
  structures: { id: number; position: [number, number, number]; rotation: number }[];
  lastSoundTime: React.MutableRefObject<number>;
  terrainType: string;
  sfxVolume: number;
  masterVolume: number;
  playerStealthLevel: number;
  difficulty: string;
}) => {
  // Bind this enemy's id into the kill callback — stable closure per enemy
  const onKilled = useCallback(
    (pos: [number, number, number], wType: WeaponType) => onKilledLocal(enemy.id, pos, wType),
    [enemy.id, onKilledLocal]
  );

  return (
    <Enemy
      id={enemy.id}
      position={enemy.position}
      weaponType={enemy.weaponType}
      onKilled={onKilled}
      onAttack={onAttack}
      onHit={onHit}
      playerPos={playerPos}
      structures={structures}
      lastSoundTime={lastSoundTime}
      terrainType={terrainType}
      sfxVolume={sfxVolume}
      masterVolume={masterVolume}
      playerStealthLevel={playerStealthLevel}
      difficulty={difficulty}
    />
  );
});

const World = ({ chapter, onEnemyKilled, onPlayerHit, onEnemyHit, onMedikitPickup, onAmmoPickup, onWeaponPickup, onAttachmentPickup, playerPos, lastSoundTime, sfxVolume, masterVolume, enemies, medikits, ammoPickups, weaponPickups, attachmentPickups, isInteracting, setNearPickup, quality, playerStealthLevel, difficulty, playerWeapons }: { 
  chapter: number, 
  onEnemyKilled: () => void, 
  onPlayerHit: (pos: [number, number, number], weaponType: WeaponType) => void,
  onEnemyHit: () => void,
  onMedikitPickup: () => void,
  onAmmoPickup: (type: WeaponType, amount: number) => void,
  onWeaponPickup: (type: WeaponType) => void,
  onAttachmentPickup: (type: AttachmentType) => void,
  playerPos: React.MutableRefObject<THREE.Vector3>,
  lastSoundTime: React.MutableRefObject<number>,
  sfxVolume: number,
  masterVolume: number,
  enemies: React.MutableRefObject<any[]>,
  medikits: React.MutableRefObject<any[]>,
  ammoPickups: React.MutableRefObject<any[]>,
  weaponPickups: React.MutableRefObject<any[]>,
  attachmentPickups: React.MutableRefObject<any[]>,
  isInteracting: boolean,
  setNearPickup: (val: string | null) => void,
  quality: string,
  playerStealthLevel: number,
  difficulty: string,
  playerWeapons: React.MutableRefObject<any[]>,
}) => {
  const currentChapter = CHAPTERS.find(c => c.id === chapter);
  const location = currentChapter?.location || "";
  const terrainType = getTerrainType(location);
  
  const foliageCount = quality === 'Low' ? 150 : quality === 'Medium' ? 300 : 500;

  // ── Foliage — recomputed with correct terrain heights whenever biome changes ──
  // Using useMemo (not useRef) ensures InstancedFoliage receives a new array
  // reference and re-renders its instanced matrices with grounded Y positions.
  const foliage = useMemo(() => {
    // Seed a deterministic-ish RNG per terrainType so positions are stable
    // across re-renders of the same chapter but differ between biomes.
    let seed = terrainType.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 9301;
    const rng = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    return Array.from({ length: foliageCount }).map((_, i) => {
      let x = (rng() - 0.5) * 480;
      let z = (rng() - 0.5) * 480;
      // Avoid water areas (max 10 retries)
      let attempts = 0;
      while (isWaterArea(x, z, terrainType) && attempts < 10) {
        x = (rng() - 0.5) * 480;
        z = (rng() - 0.5) * 480;
        attempts++;
      }
      const y = getTerrainHeight(x, z, terrainType);
      return {
        id: i,
        position: [x, y, z] as [number, number, number],
        type: rng() > 0.3 ? 'tree' : 'rock',
        scale: 0.8 + rng() * 1.5,
      };
    });
  }, [terrainType, foliageCount]);

  // ── Structures — also recomputed with correct terrain heights ──────
  const structures = useMemo(() => {
    let seed = (terrainType.split('').reduce((acc, c) => acc + c.charCodeAt(0), 42) * 6271) % 999983;
    const rng = () => { seed = (seed * 6271 + 111) % 999983; return seed / 999983; };
    return Array.from({ length: 15 }).map((_, i) => {
      const sx = (rng() - 0.5) * 150;
      const sz = (rng() - 0.5) * 150;
      return {
        id: i,
        position: [sx, getTerrainHeight(sx, sz, terrainType), sz] as [number, number, number],
        rotation: rng() * Math.PI,
      };
    });
  }, [terrainType]);

  const medikitDroppedThisChapter = useRef(false);

  const { gl } = useThree();

  // ── Register AABB colliders for PlayerTracker ────────────────────────
  useEffect(() => {
    const hw = terrainType === 'port'   ? 1.5 :
               terrainType === 'base'   ? 1.5 :
               terrainType === 'ruins'  ? 1.0 :
               terrainType === 'prison' ? 2.5 : 1.5;
    const hd = terrainType === 'port'   ? 1.5 :
               terrainType === 'base'   ? 1.5 :
               terrainType === 'ruins'  ? 0.2 :
               terrainType === 'prison' ? 2.5 : 1.5;

    const colliders = structures.map(s => ({
      x: s.position[0], z: s.position[2], hw, hd
    }));

    // Chapter 1 boat collider
    if (chapter === 1 && terrainType === 'shore') {
      colliders.push({ x: 0, z: 30, hw: 2.0, hd: 6.5 });
    }

    // Port-specific colliders for static structures
    if (terrainType === 'port') {
      // Docked ship hull
      colliders.push({ x: 15, z: 72, hw: 4, hd: 10 });
      // Yachts
      colliders.push({ x: -20, z: 68, hw: 1.5, hd: 5 });
      colliders.push({ x: -35, z: 70, hw: 1.5, hd: 5 });
      // Warehouse
      colliders.push({ x: -10, z: 20, hw: 6, hd: 8 });
      // Cranes
      colliders.push({ x: 10, z: 50, hw: 5, hd: 1 });
      colliders.push({ x: 40, z: 50, hw: 5, hd: 1 });
      // Shipping containers
      colliders.push({ x: 25, z: 30, hw: 1.5, hd: 3.5 });
      colliders.push({ x: 30, z: 20, hw: 1.5, hd: 3.5 });
      colliders.push({ x: 35, z: 35, hw: 1.5, hd: 3.5 });
      colliders.push({ x: -30, z: 30, hw: 1.5, hd: 3.5 });
      colliders.push({ x: -25, z: 40, hw: 1.5, hd: 3.5 });
      // Pier wall
      colliders.push({ x: 0, z: 60, hw: 100, hd: 1.5 });
    }

    // Base-specific colliders for tents, wooden houses, watchtowers
    if (terrainType === 'base') {
      // Tents
      colliders.push({ x: -12, z: -10, hw: 2.5, hd: 3.5 });
      colliders.push({ x: 10, z: -15, hw: 2.5, hd: 3.5 });
      colliders.push({ x: -5, z: 10, hw: 2.5, hd: 3.5 });
      colliders.push({ x: 0, z: 0, hw: 2.5, hd: 3.5 });
      // Wooden houses
      colliders.push({ x: 20, z: 5, hw: 3, hd: 2.5 });
      colliders.push({ x: -18, z: 12, hw: 3, hd: 2.5 });
      colliders.push({ x: 15, z: -20, hw: 3, hd: 2.5 });
      // Watchtowers
      colliders.push({ x: 30, z: 30, hw: 1.5, hd: 1.5 });
      colliders.push({ x: -30, z: -25, hw: 1.5, hd: 1.5 });
    }

    // Tree trunk and rock colliders
    foliage.forEach(item => {
      if (item.type === 'tree') {
        const r = 0.4 * item.scale;
        colliders.push({ x: item.position[0], z: item.position[2], hw: r, hd: r });
      } else {
        const r = 0.6 * item.scale;
        colliders.push({ x: item.position[0], z: item.position[2], hw: r, hd: r });
      }
    });

    (gl as any)._structureColliders = colliders;
    return () => { (gl as any)._structureColliders = []; };
  }, [terrainType, chapter, gl, foliage, structures]);


  useEffect(() => {
    medikitDroppedThisChapter.current = false;

    enemies.current = Array.from({ length: currentChapter?.enemyCount || 0 }).map((_, i) => {
      let weaponType = WeaponType.PISTOL;
      
      if (i === 0 && chapter > 3) {
        weaponType = WeaponType.RIFLE;
      } else if (chapter <= 3) {
        weaponType = WeaponType.PISTOL;
      } else if (chapter >= 15) {
        const rand = Math.random();
        if (rand > 0.5) weaponType = WeaponType.ASSAULT_RIFLE;
        else if (rand > 0.3) weaponType = WeaponType.RIFLE;
        else if (rand > 0.15) weaponType = WeaponType.SHOTGUN;
        else weaponType = WeaponType.REVOLVER;
      } else {
        const rand = Math.random();
        if (rand > 0.5) weaponType = WeaponType.ASSAULT_RIFLE;
        else if (rand > 0.3) weaponType = WeaponType.RIFLE;
        else if (rand > 0.15) weaponType = WeaponType.SHOTGUN;
        else if (rand > 0.05) weaponType = WeaponType.REVOLVER;
        else weaponType = WeaponType.PISTOL;
      }

      let x: number, z: number;
      if (i === 0 && chapter > 3) {
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * (80 + Math.random() * 40);
        z = Math.sin(angle) * (80 + Math.random() * 40);
      } else {
        x = (Math.random() - 0.5) * 150;
        z = (Math.random() - 0.5) * 150 - 40;
      }

      const y = getTerrainHeight(x, z, terrainType);

      return {
        id: i,
        weaponType,
        position: [x, y, z] as [number, number, number]
      };
    });

    const medikitCount = currentChapter?.medikitCount || 0;
    medikits.current = Array.from({ length: medikitCount }).map((_, i) => {
      const x = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60 - 10;
      const y = getTerrainHeight(x, z, terrainType) + 0.1;
      return {
        id: i,
        position: [x, y, z] as [number, number, number]
      };
    });

    ammoPickups.current = [];
    weaponPickups.current = []; // Weapons drop from enemies only — no world spawns
    attachmentPickups.current = [];
  }, [chapter, terrainType]);

  // ── Stable refs for callbacks passed to Enemy ───────────────────────────
  // These refs always hold the latest function but never change identity,
  // so React.memo on Enemy blocks re-renders when parent state changes.
  const onEnemyKilledRef = useRef(onEnemyKilled);
  onEnemyKilledRef.current = onEnemyKilled;
  const onPlayerHitRef = useRef(onPlayerHit);
  onPlayerHitRef.current = onPlayerHit;
  const onEnemyHitRef = useRef(onEnemyHit);
  onEnemyHitRef.current = onEnemyHit;

  // Stable kill handler — identity never changes so Enemy.onKilled prop is stable
  const handleEnemyKilledLocal = useCallback((id: number, pos: [number, number, number], weaponType: WeaponType) => {
    // ── Remove dead enemy from ref immediately ────────────────────────
    enemies.current = enemies.current.filter(e => e.id !== id);

    // ── Defer ALL pickup mutations to the next animation frame ────────
    // This prevents the pickup push + re-render from blocking the
    // current frame, eliminating the visible lag spike on kill.
    requestAnimationFrame(() => {
      let amount = 40;
      if (weaponType === WeaponType.REVOLVER)      amount = 20;
      if (weaponType === WeaponType.SHOTGUN)       amount = 12;
      if (weaponType === WeaponType.RIFLE)         amount = 10;
      if (weaponType === WeaponType.ASSAULT_RIFLE) amount = 60;
      if (weaponType === WeaponType.KNIFE)         amount = 0;

      if (amount > 0) {
        ammoPickups.current.push({
          id: `ammo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: [pos[0] + 0.3, pos[1] + 0.1, pos[2]],
          type: weaponType,
          amount
        });
      }

      // Gun drop — only if player doesn't already own this weapon
      if (weaponType !== WeaponType.KNIFE) {
        const playerAlreadyHas = playerWeapons.current.some((w: any) => w.type === weaponType);
        if (!playerAlreadyHas) {
          weaponPickups.current.push({
            id: `wdrop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: weaponType,
            position: [pos[0] - 0.3, pos[1] + 0.1, pos[2]] as [number, number, number]
          });
        }
      }

      // Random attachment drop (30% chance)
      if (Math.random() > 0.7) {
        const types = [AttachmentType.SCOPE, AttachmentType.SILENCER, AttachmentType.EXTENDED_MAG, AttachmentType.RECOIL_CONTROLLER];
        const type = types[Math.floor(Math.random() * types.length)];
        attachmentPickups.current.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          position: [pos[0], pos[1] + 0.1, pos[2]]
        });
      }

      // First medikit drop per chapter
      if (!medikitDroppedThisChapter.current) {
        medikitDroppedThisChapter.current = true;
        medikits.current.push({
          id: `medikit-drop-${Date.now()}`,
          position: [pos[0], pos[1] + 0.1, pos[2]] as [number, number, number]
        });
      }
    });

    // ── Defer kill-count setState via startTransition ────────────────
    // Marks this as a non-urgent update so React yields to the 3D
    // render loop before processing kill streak / zone completion logic.
    startTransition(() => {
      onEnemyKilledRef.current();
    });
  }, []); // empty deps — stable for the lifetime of the component

  // Stable per-enemy callbacks backed by refs (never change identity)
  const stableOnAttack = useCallback((pos: [number, number, number], wType: WeaponType) => {
    onPlayerHitRef.current(pos, wType);
  }, []);
  const stableOnHit = useCallback(() => {
    onEnemyHitRef.current();
  }, []);

  const tempVec = useRef(new THREE.Vector3());
  const lastNearest = useRef<string | null>(null);
  const frameCounter = useRef(0);

  useFrame(() => {
    frameCounter.current++;
    if (frameCounter.current % 8 !== 0) return; // throttled to ~7.5fps for pickup checks

    let nearest = null;
    let minDistance = 4.0;
    
    medikits.current.forEach(kit => {
      tempVec.current.set(kit.position[0], kit.position[1], kit.position[2]);
      const dist = playerPos.current.distanceTo(tempVec.current);
      if (dist < minDistance) { nearest = "Medikit"; minDistance = dist; }
    });
    ammoPickups.current.forEach(ammo => {
      tempVec.current.set(ammo.position[0], ammo.position[1], ammo.position[2]);
      const dist = playerPos.current.distanceTo(tempVec.current);
      if (dist < minDistance) { nearest = "Ammo"; minDistance = dist; }
    });
    weaponPickups.current.forEach(weapon => {
      tempVec.current.set(weapon.position[0], weapon.position[1], weapon.position[2]);
      const dist = playerPos.current.distanceTo(tempVec.current);
      if (dist < minDistance) { nearest = (WEAPONS_DATA as Record<string, any>)[weapon.type].name; minDistance = dist; }
    });
    attachmentPickups.current.forEach(attachment => {
      tempVec.current.set(attachment.position[0], attachment.position[1], attachment.position[2]);
      const dist = playerPos.current.distanceTo(tempVec.current);
      if (dist < minDistance) { nearest = (ATTACHMENTS_DATA as Record<string, any>)[attachment.type].name; minDistance = dist; }
    });
    
    if (nearest !== lastNearest.current) {
      setNearPickup(nearest);
      lastNearest.current = nearest;
    }
  });

  return (
    <>
      <StaticEnvironment terrainType={terrainType} foliage={foliage} structures={structures} quality={quality} locationName={location} />

      {/* Chapter 1: Marcus is on his charter boat offshore */}
      {chapter === 1 && terrainType === 'shore' && <CharterBoat />}

      {medikits.current.map(kit => (
        <Medikit 
          key={`medikit-${kit.id}`} 
          position={kit.position} 
          onPickup={onMedikitPickup} 
          onRemove={() => { medikits.current = medikits.current.filter(k => k.id !== kit.id); }}
          playerPos={playerPos} 
          isInteracting={isInteracting} 
          sfxVolume={sfxVolume} 
          masterVolume={masterVolume} 
        />
      ))}

      {ammoPickups.current.map(ammo => (
        <AmmoPickup 
          key={`ammo-${ammo.id}`} 
          position={ammo.position} 
          type={ammo.type}
          amount={ammo.amount}
          onPickup={(type, amount) => {
            ammoPickups.current = ammoPickups.current.filter(a => a.id !== ammo.id);
            onAmmoPickup(type, amount);
          }} 
          playerPos={playerPos} 
          isInteracting={isInteracting}
          sfxVolume={sfxVolume}
          masterVolume={masterVolume}
        />
      ))}

      {weaponPickups.current.map(weapon => (
        <WeaponPickup 
          key={`weapon-${weapon.id}`} 
          position={weapon.position} 
          type={weapon.type} 
          onPickup={onWeaponPickup} 
          onRemove={() => { weaponPickups.current = weaponPickups.current.filter(w => w.id !== weapon.id); }}
          playerPos={playerPos} 
          isInteracting={isInteracting} 
          sfxVolume={sfxVolume} 
          masterVolume={masterVolume} 
        />
      ))}

      {attachmentPickups.current.map(att => (
        <AttachmentPickup key={`att-${att.id}`} position={att.position} type={att.type} onPickup={onAttachmentPickup} playerPos={playerPos} isInteracting={isInteracting} sfxVolume={sfxVolume} masterVolume={masterVolume} />
      ))}

      {enemies.current.map(enemy => (
        <EnemyWrapper
          key={`enemy-${enemy.id}`}
          enemy={enemy}
          onKilledLocal={handleEnemyKilledLocal}
          onAttack={stableOnAttack}
          onHit={stableOnHit}
          playerPos={playerPos}
          structures={structures}
          lastSoundTime={lastSoundTime}
          terrainType={terrainType}
          sfxVolume={sfxVolume}
          masterVolume={masterVolume}
          playerStealthLevel={playerStealthLevel}
          difficulty={difficulty}
        />
      ))}

      {/* 3D Objective Beacon for story chapters */}
      {currentChapter?.objectivePosition && currentChapter.enemyCount === 0 && (
        <group position={[currentChapter.objectivePosition[0], getTerrainHeight(currentChapter.objectivePosition[0], currentChapter.objectivePosition[1], terrainType), currentChapter.objectivePosition[1]]}>
          {/* Vertical beam */}
          <mesh position={[0, 8, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 16, 8]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} />
          </mesh>
          {/* Ground ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
            <ringGeometry args={[1.5, 2, 32]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.5} side={2} />
          </mesh>
          {/* Inner glow */}
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} />
          </mesh>
        </group>
      )}
    </>
  );
};

export default World;
