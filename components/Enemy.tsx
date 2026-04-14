import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import { WeaponType, Difficulty } from '@/types';
import { getTerrainHeight } from '@/components/Environment';
import { playFootstep } from '@/hooks/useAudioEngine';

// ─── AI State Machine ────────────────────────────────────────────────
// PATROL  → walks random waypoints, completely unaware
// ALERT   → heard/saw something, moving to investigate
// CHASE   → confirmed player, chasing hard
// ATTACK  → in range, standing still to fire
// COVER   → taking cover behind structure, firing from concealment
// RETREAT → health < 25%, falling back and calling for help

type AIState = 'PATROL' | 'ALERT' | 'CHASE' | 'ATTACK' | 'COVER' | 'RETREAT';

// Global alert channel — one enemy detecting player alerts nearby enemies
const alertChannel = { alerted: false, alertPos: new THREE.Vector3(), alertTime: 0 };

const Enemy = React.memo(({
  id, position, weaponType,
  onKilled, onAttack, onHit,
  playerPos, structures, lastSoundTime,
  terrainType, sfxVolume, masterVolume, playerStealthLevel, difficulty
}: {
  id: number;
  position: [number, number, number];
  weaponType: WeaponType;
  onKilled: (pos: [number, number, number], weaponType: WeaponType) => void;
  onAttack: (pos: [number, number, number], weaponType: WeaponType) => void;
  onHit: () => void;
  playerPos: React.MutableRefObject<THREE.Vector3>;
  structures: { position: [number, number, number] }[];
  lastSoundTime: React.MutableRefObject<number>;
  terrainType: string;
  sfxVolume: number;
  masterVolume: number;
  playerStealthLevel: number;
  difficulty: string;
}) => {
  const [health, setHealth] = useState(100);
  const [isDead, setIsDead] = useState(false);
  const [isStaggered, setIsStaggered] = useState(false);
  const [displayHealth, setDisplayHealth] = useState(100);

  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  // AI persistent state
  const aiState = useRef<AIState>('PATROL');
  const lastAttackTime = useRef(0);
  const lastFootstepTime = useRef(0);
  const lastStateChange = useRef(0);
  const aiTick = useRef(Math.floor(Math.random() * 12)); // stagger ticks across enemies
  const alertCooldown = useRef(0);

  // Patrol waypoints — generated once on mount
  const patrolWaypoints = useRef<THREE.Vector3[]>([]);
  const patrolIdx = useRef(0);
  const patrolWaitTimer = useRef(0);

  // Cover target
  const coverTarget = useRef<THREE.Vector3 | null>(null);
  const isInCover = useRef(false);

  // Reusable vectors (no allocations per frame)
  const tempVec = useRef(new THREE.Vector3());
  const tempDir = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const yAxis = useRef(new THREE.Vector3(0, 1, 0));

  // Enemy stats vary by weapon type
  const isHardcore = difficulty === Difficulty.HARDCORE;
  const diffAccuracyMult  = isHardcore ? 1.20 : 1.0;  // +20% accuracy on Hardcore
  const diffFireRateMult  = isHardcore ? 0.75 : 1.0;  // -25% fire interval (shoots faster)
  const diffDetectMult    = isHardcore ? 1.30 : 1.0;  // +30% detection radius

  const baseSpeed = weaponType === WeaponType.ASSAULT_RIFLE ? 1.4 :
                    weaponType === WeaponType.KNIFE ? 2.2 : 1.1 + Math.random() * 0.5;
  const attackRange = weaponType === WeaponType.SHOTGUN ? 6 :
                      weaponType === WeaponType.KNIFE ? 2.5 :
                      weaponType === WeaponType.ASSAULT_RIFLE ? 12 : 18;
  const accuracy = Math.min(0.99, (weaponType === WeaponType.ASSAULT_RIFLE ? 0.85 :
                   weaponType === WeaponType.RIFLE ? 0.95 :
                   weaponType === WeaponType.SHOTGUN ? 0.7 : 0.6) * diffAccuracyMult);
  const fireRate = (weaponType === WeaponType.ASSAULT_RIFLE ? 1.2 :
                   weaponType === WeaponType.RIFLE ? 3.5 :
                   weaponType === WeaponType.SHOTGUN ? 2.8 :
                   weaponType === WeaponType.PISTOL ? 2.0 : 999) * diffFireRateMult;

  // ─── Generate patrol waypoints on mount ──────────────────────────
  useEffect(() => {
    if (!groupRef.current) return;
    const base = groupRef.current.position;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 8 + Math.random() * 12;
      const x = base.x + Math.cos(angle) * radius;
      const z = base.z + Math.sin(angle) * radius;
      pts.push(new THREE.Vector3(x, getTerrainHeight(x, z, terrainType), z));
    }
    patrolWaypoints.current = pts;
  }, [terrainType]);

  // ─── Obstacle avoidance steering ─────────────────────────────────
  const steerAround = (from: THREE.Vector3, target: THREE.Vector3): THREE.Vector3 => {
    tempDir.current.copy(target).sub(from);
    tempDir.current.y = 0;
    tempDir.current.normalize();

    // Check 5 candidate angles, pick first unblocked
    const ANGLES = [0, 0.45, -0.45, 0.9, -0.9];
    for (const angle of ANGLES) {
      const candidate = angle === 0
        ? tempDir.current.clone()
        : tempDir.current.clone().applyAxisAngle(yAxis.current, angle);

      let blocked = false;
      for (const s of structures) {
        if (!s?.position) continue;
        tempVec.current.set(s.position[0], 0, s.position[2]);
        const toS = tempVec.current.clone().sub(from);
        toS.y = 0;
        const dot = toS.dot(candidate);
        if (dot > 0 && dot < 5) {
          const cross = Math.sqrt(Math.max(0, toS.lengthSq() - dot * dot));
          if (cross < 2.5) { blocked = true; break; }
        }
      }
      if (!blocked) return candidate;
    }
    return tempDir.current.clone();
  };

  // ─── Find nearest cover position ─────────────────────────────────
  const findCover = (from: THREE.Vector3, fleeFrom: THREE.Vector3): THREE.Vector3 | null => {
    if (!structures || structures.length === 0) return null;

    let bestScore = -Infinity;
    let best: THREE.Vector3 | null = null;

    for (const s of structures) {
      if (!s?.position) continue;
      const sp = new THREE.Vector3(s.position[0], s.position[1], s.position[2]);
      const distToEnemy = sp.distanceTo(from);
      if (distToEnemy > 20) continue; // too far to reach

      // Cover score: close to me, far(ish) from player, cover blocks LOS
      const distToPlayer = sp.distanceTo(fleeFrom);
      const score = distToPlayer * 0.5 - distToEnemy * 2;
      if (score > bestScore) {
        bestScore = score;
        // Stand slightly behind structure, away from player
        const awayDir = sp.clone().sub(fleeFrom).normalize().multiplyScalar(1.5);
        best = sp.clone().add(awayDir);
        best.y = getTerrainHeight(best.x, best.z, terrainType);
      }
    }
    return best;
  };

  // ─── Main AI useFrame ─────────────────────────────────────────────
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (isDead || !groupRef.current || !meshRef.current) return;

    aiTick.current++;
    const now = performance.now() / 1000; // seconds
    const pos = groupRef.current.position;
    const distance = pos.distanceTo(playerPos.current);

    // ── Stagger flash ──────────────────────────────────────────────
    if (isStaggered) {
      meshRef.current.rotation.x = Math.sin(now * 30) * 0.15;
      return;
    }
    meshRef.current.rotation.x = 0;

    // ── Footstep audio (only if close) ────────────────────────────
    if (aiState.current !== 'PATROL' && distance < 30 && now - lastFootstepTime.current > 0.45) {
      const vol = Math.max(0, 1 - distance / 30) * 0.5;
      playFootstep(terrainType, vol, 0.85, sfxVolume, masterVolume);
      lastFootstepTime.current = now;
    }

    // ── AI state transitions (every 12 frames, staggered per enemy) ─
    if (aiTick.current % 12 === 0) {
      const timeSinceSound = Date.now() - lastSoundTime.current;
      const stealth = Math.max(0.2, playerStealthLevel);
      // Effective detection radius scales with stealth
      const detectRadius = 30 * stealth * diffDetectMult;
      const chaseRadius  = 50 * stealth * diffDetectMult;
      const alertRadius = 45;

      const canSeePlayer = distance < detectRadius;
      const heardPlayer = timeSinceSound < 4000;

      // Check global alert channel — nearby enemy already spotted player
      const globalAlert = alertChannel.alerted &&
        (now - alertChannel.alertTime) < 8 &&
        pos.distanceTo(alertChannel.alertPos) < alertRadius;

      const currentState = aiState.current;
      const stateDuration = now - lastStateChange.current;

      let next: AIState = currentState;

      if (health <= 25 && currentState !== 'RETREAT') {
        next = 'RETREAT';
      } else if (canSeePlayer && distance < attackRange) {
        next = 'ATTACK';
      } else if (canSeePlayer && currentState === 'ATTACK' && distance >= attackRange && distance < 22) {
        next = 'COVER';
      } else if (canSeePlayer || globalAlert) {
        // Broadcast alert to other enemies
        alertChannel.alerted = true;
        alertChannel.alertPos.copy(playerPos.current);
        alertChannel.alertTime = now;
        next = distance < 16 ? 'CHASE' : 'CHASE';
      } else if (heardPlayer && currentState === 'PATROL') {
        next = 'ALERT';
      } else if (currentState === 'ALERT' && stateDuration > 6) {
        next = 'PATROL'; // investigated, nothing found
      } else if ((currentState === 'CHASE' || currentState === 'COVER') && !canSeePlayer && stateDuration > 5) {
        next = 'ALERT'; // lost sight, investigate
      } else if (currentState === 'RETREAT' && distance > 35) {
        next = 'ALERT'; // far enough, calm down
      }

      if (next !== currentState) {
        aiState.current = next;
        lastStateChange.current = now;
        // Reset cover when leaving it
        if (next !== 'COVER') { coverTarget.current = null; isInCover.current = false; }
      }
    }

    // ── Movement & behaviour per state ────────────────────────────
    const state = aiState.current;

    if (state === 'PATROL') {
      // Walk between waypoints
      if (patrolWaypoints.current.length > 0) {
        patrolWaitTimer.current -= dt;
        const wp = patrolWaypoints.current[patrolIdx.current];
        const distToWp = pos.distanceTo(wp);

        if (distToWp < 1.5 || patrolWaitTimer.current > 0) {
          // Reached waypoint — idle/wait
          meshRef.current.position.y = Math.sin(now * 1.5) * 0.03;
          if (distToWp < 1.5 && patrolWaitTimer.current <= 0) {
            patrolIdx.current = (patrolIdx.current + 1) % patrolWaypoints.current.length;
            patrolWaitTimer.current = 1.5 + Math.random() * 2; // wait 1.5–3.5s
          }
        } else {
          const moveDir = steerAround(pos, wp);
          pos.addScaledVector(moveDir, baseSpeed * 0.6 * dt);
          pos.y = getTerrainHeight(pos.x, pos.z, terrainType);
          groupRef.current.lookAt(wp.x, pos.y, wp.z);
          _walkAnim(now, 8);
        }
      }
    }

    else if (state === 'ALERT') {
      // Move toward last known player position (or sound), look around
      const alertTarget = alertChannel.alerted
        ? alertChannel.alertPos
        : playerPos.current;
      const distToAlert = pos.distanceTo(alertTarget);

      if (distToAlert > 3) {
        const moveDir = steerAround(pos, alertTarget);
        pos.addScaledVector(moveDir, baseSpeed * 0.8 * dt);
        pos.y = getTerrainHeight(pos.x, pos.z, terrainType);
        groupRef.current.lookAt(alertTarget.x, pos.y, alertTarget.z);
        _walkAnim(now, 9);
      } else {
        // At destination — look around
        groupRef.current.rotation.y += delta * 0.8;
        meshRef.current.position.y = Math.sin(now * 2) * 0.04;
      }
    }

    else if (state === 'CHASE') {
      // Sprint toward player
      const moveDir = steerAround(pos, playerPos.current);
      pos.addScaledVector(moveDir, baseSpeed * 1.6 * dt);
      pos.y = getTerrainHeight(pos.x, pos.z, terrainType);
      groupRef.current.lookAt(playerPos.current.x, pos.y, playerPos.current.z);
      _walkAnim(now, 14);
    }

    else if (state === 'ATTACK') {
      // Face player, fire, strafe laterally
      groupRef.current.lookAt(playerPos.current.x, pos.y, playerPos.current.z);

      // Small strafe to avoid being a static target
      const strafe = Math.sin(now * 1.8) * 2.5 * dt;
      tempOffset.current.set(Math.cos(now * 1.8), 0, 0);
      pos.addScaledVector(tempOffset.current, strafe);
      pos.y = getTerrainHeight(pos.x, pos.z, terrainType);

      // Fire with accuracy spread
      const attackInterval = fireRate;
      if (now - lastAttackTime.current > attackInterval) {
        if (Math.random() < accuracy) {
          onAttack([pos.x, pos.y, pos.z], weaponType);
        }
        lastAttackTime.current = now;
      }

      // Aim arm up
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.PI / 2 + Math.sin(now * 22) * 0.04;
      meshRef.current.position.y = 0;
    }

    else if (state === 'COVER') {
      // Find + move to cover, then fire from behind it
      if (!coverTarget.current) {
        coverTarget.current = findCover(pos, playerPos.current);
      }

      if (coverTarget.current) {
        const distToCover = pos.distanceTo(coverTarget.current);

        if (distToCover > 1.2) {
          // Sprint to cover
          const moveDir = steerAround(pos, coverTarget.current);
          pos.addScaledVector(moveDir, baseSpeed * 1.4 * dt);
          pos.y = getTerrainHeight(pos.x, pos.z, terrainType);
          groupRef.current.lookAt(coverTarget.current.x, pos.y, coverTarget.current.z);
          _walkAnim(now, 13);
        } else {
          // In cover — peek fire
          isInCover.current = true;
          groupRef.current.lookAt(playerPos.current.x, pos.y, playerPos.current.z);

          // Peek out every ~3s for a burst
          const peekCycle = Math.sin(now * 0.8);
          const isPeeking = peekCycle > 0.5;

          if (isPeeking && now - lastAttackTime.current > fireRate * 1.5) {
            if (Math.random() < accuracy * 0.85) {
              onAttack([pos.x, pos.y, pos.z], weaponType);
            }
            lastAttackTime.current = now;
          }

          // Lean animation
          meshRef.current.position.x = isPeeking ? 0.4 : 0;
          meshRef.current.position.y = isPeeking ? 0 : -0.3;
        }
      }
    }

    else if (state === 'RETREAT') {
      // Run away from player, shout (via lastSoundTime)
      tempDir.current.copy(pos).sub(playerPos.current).normalize();
      pos.addScaledVector(tempDir.current, baseSpeed * 1.8 * dt);
      pos.y = getTerrainHeight(pos.x, pos.z, terrainType);
      groupRef.current.lookAt(playerPos.current.x, pos.y, playerPos.current.z);
      _walkAnim(now, 16);

      // Still fires while retreating (suppressing fire), less accurate
      if (now - lastAttackTime.current > fireRate * 2.5 && Math.random() < 0.3) {
        onAttack([pos.x, pos.y, pos.z], weaponType);
        lastAttackTime.current = now;
      }
    }

    // Update mutable position reference
    position[0] = pos.x;
    position[1] = pos.y;
    position[2] = pos.z;
  });

  // ─── Walk animation helper ────────────────────────────────────────
  const _walkAnim = (t: number, freq: number) => {
    if (!meshRef.current) return;
    const a = Math.sin(t * freq) * 0.55;
    if (leftLegRef.current) leftLegRef.current.rotation.x = a;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -a;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -a * 0.5;
    if (rightArmRef.current) rightArmRef.current.rotation.x = a * 0.5;
    meshRef.current.position.y = Math.abs(Math.sin(t * freq)) * 0.08;
  };

  // ─── Hit detection ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail.id !== id || isDead) return;
      onHit();
      setIsStaggered(true);
      setTimeout(() => setIsStaggered(false), 280);

      if (groupRef.current) {
        window.dispatchEvent(new CustomEvent('blood-splatter', {
          detail: { position: [groupRef.current.position.x, groupRef.current.position.y + 1.2, groupRef.current.position.z] }
        }));
      }

      setHealth(prev => {
        const next = prev - e.detail.damage;
        setDisplayHealth(Math.max(0, next));
        if (next <= 0) {
          setIsDead(true);
          const p = groupRef.current;
          const pos: [number, number, number] = p ? [p.position.x, p.position.y, p.position.z] : position;
          setTimeout(() => onKilled(pos, weaponType), 450);
          return 0;
        }
        // Immediately switch to CHASE when hit (even from stealth)
        if (aiState.current === 'PATROL' || aiState.current === 'ALERT') {
          aiState.current = 'CHASE';
          lastStateChange.current = performance.now() / 1000;
          // Broadcast alert
          alertChannel.alerted = true;
          alertChannel.alertPos.copy(playerPos.current);
          alertChannel.alertTime = performance.now() / 1000;
        }
        return next;
      });
    };
    window.addEventListener('enemy-hit', handler);
    return () => window.removeEventListener('enemy-hit', handler);
  }, [id, isDead, onHit, onKilled, weaponType]);

  if (isDead) return null;

  const weaponLen = weaponType === WeaponType.PISTOL ? 0.3 :
    weaponType === WeaponType.SHOTGUN ? 0.75 :
    weaponType === WeaponType.RIFLE ? 1.1 :
    weaponType === WeaponType.ASSAULT_RIFLE ? 0.85 : 0.15;
  const weaponColor = weaponType === WeaponType.RIFLE || weaponType === WeaponType.SHOTGUN ? '#4a3528' : '#111';

  const hpPct = Math.max(0, displayHealth / 100);
  const hpColor = hpPct > 0.6 ? '#22c55e' : hpPct > 0.3 ? '#facc15' : '#ef4444';

  return (
    <group ref={groupRef} position={position}>
      <group ref={meshRef}>
        {/* Head */}
        <mesh position={[0, 1.8, 0]} castShadow>
          <boxGeometry args={[0.22, 0.25, 0.22]} />
          <meshStandardMaterial color="#d2b48c" />
          {/* Helmet */}
          <mesh position={[0, 0.12, 0]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.45, 0.05, 0.45]} />
            <meshStandardMaterial color="#2b1d0e" />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color="#2b1d0e" />
          </mesh>
          <mesh position={[0, -0.05, 0.05]}>
            <boxGeometry args={[0.23, 0.15, 0.2]} />
            <meshStandardMaterial color="#2b1d0e" />
          </mesh>
        </mesh>

        {/* Body */}
        <mesh position={[0, 1.25, 0]} castShadow>
          <boxGeometry args={[0.5, 0.65, 0.28]} />
          <meshStandardMaterial color="#3a4a2a" />
        </mesh>

        {/* Belt */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.48, 0.1, 0.25]} />
          <meshStandardMaterial color="#111" />
        </mesh>

        {/* Left arm */}
        <group ref={leftArmRef} position={[-0.3, 1.5, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.12, 0.45, 0.12]} />
            <meshStandardMaterial color="#3a4a2a" />
          </mesh>
        </group>

        {/* Right arm + weapon */}
        <group ref={rightArmRef} position={[0.3, 1.5, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.12, 0.45, 0.12]} />
            <meshStandardMaterial color="#3a4a2a" />
          </mesh>
          <group position={[0, -0.4, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.08, weaponLen, 0.1]} />
              <meshStandardMaterial color={weaponColor} metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        </group>

        {/* Left leg */}
        <group ref={leftLegRef as any} position={[-0.15, 0.8, 0]}>
          <mesh position={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.18, 0.8, 0.18]} />
            <meshStandardMaterial color="#1a2a1a" />
          </mesh>
        </group>

        {/* Right leg */}
        <group ref={rightLegRef as any} position={[0.15, 0.8, 0]}>
          <mesh position={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.18, 0.8, 0.18]} />
            <meshStandardMaterial color="#1a2a1a" />
          </mesh>
        </group>
      </group>

      {/* Health bar */}
      <Billboard position={[0, 2.4, 0]}>
        {/* Background */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.1, 0.12]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        {/* HP fill */}
        <mesh position={[-0.55 + (hpPct * 1.1) / 2, 0, 0]}>
          <planeGeometry args={[hpPct * 1.1, 0.1]} />
          <meshBasicMaterial color={hpColor} />
        </mesh>
      </Billboard>
    </group>
  );
});

export default Enemy;
