import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { WeaponType, AttachmentType } from '@/types';
import { WEAPONS_DATA, ATTACHMENTS_DATA } from '@/constants';
import { playPickupSound } from '@/hooks/useAudioEngine';

export const Medikit = React.memo(({ position, onPickup, onRemove, playerPos, isInteracting, sfxVolume, masterVolume }: { 
  position: [number, number, number], 
  onPickup: () => void,
  onRemove?: () => void,
  playerPos: React.MutableRefObject<THREE.Vector3>, 
  isInteracting: boolean,
  sfxVolume: number,
  masterVolume: number
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const pickedUp = useRef(false);

  useFrame((state: any) => {
    if (!pickedUp.current && groupRef.current) {
      const now = state.clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(now * 2) * 0.1;
      if (playerPos.current.distanceTo(groupRef.current.position) < 2 && isInteracting) {
        pickedUp.current = true;
        playPickupSound(sfxVolume, masterVolume);
        onPickup();
        onRemove?.();
      }
    }
  });

  if (pickedUp.current) return null;

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.5]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, 0.2, 0.26]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <pointLight position={[0, 0.5, 0]} intensity={0.5} color="white" distance={3} />
    </group>
  );
});

export const AmmoPickup = React.memo(({ position, type, amount, onPickup, playerPos, isInteracting, sfxVolume, masterVolume }: { 
  position: [number, number, number], 
  type: WeaponType, 
  amount: number, 
  onPickup: (type: WeaponType, amount: number) => void, 
  playerPos: React.MutableRefObject<THREE.Vector3>, 
  isInteracting: boolean,
  sfxVolume: number,
  masterVolume: number
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const pickedUp = useRef(false);

  useFrame((state: any) => {
    if (!pickedUp.current && groupRef.current) {
      const now = state.clock.getElapsedTime();
      groupRef.current.rotation.y = now;
      groupRef.current.position.y = position[1] + Math.sin(now * 2) * 0.1;
      
      if (playerPos.current.distanceTo(groupRef.current.position) < 2 && isInteracting) {
        pickedUp.current = true;
        playPickupSound(sfxVolume, masterVolume);
        onPickup(type, amount);
      }
    }
  });

  if (pickedUp.current) return null;

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.2]} />
        <meshStandardMaterial color="#b8860b" />
      </mesh>
      <mesh position={[0, 0.2, 0.11]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
      <pointLight position={[0, 0.5, 0]} intensity={0.5} color="yellow" distance={3} />
      <Html position={[0, 0.8, 0]} center>
        <div className="bg-black/80 text-white px-2 py-1 text-[8px] font-black uppercase tracking-widest whitespace-nowrap rounded border border-yellow-500/50">
          +{amount} {type} AMMO
        </div>
      </Html>
    </group>
  );
});

export const WeaponPickup = React.memo(({ position, type, onPickup, onRemove, playerPos, isInteracting, sfxVolume, masterVolume }: { 
  position: [number, number, number], 
  type: WeaponType, 
  onPickup: (type: WeaponType) => void,
  onRemove?: () => void,
  playerPos: React.MutableRefObject<THREE.Vector3>, 
  isInteracting: boolean,
  sfxVolume: number,
  masterVolume: number
}) => {
  const weapon = WEAPONS_DATA[type];
  const groupRef = useRef<THREE.Group>(null);
  const pickedUp = useRef(false);

  useFrame((state: any) => {
    if (!pickedUp.current && groupRef.current) {
      const now = state.clock.getElapsedTime();
      groupRef.current.rotation.y = now;
      groupRef.current.position.y = position[1] + Math.sin(now * 2) * 0.1;
      
      if (playerPos.current.distanceTo(groupRef.current.position) < 2 && isInteracting) {
        pickedUp.current = true;
        playPickupSound(sfxVolume, masterVolume);
        onPickup(type);
        onRemove?.();
      }
    }
  });

  if (pickedUp.current) return null;

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 0.2, 0.4]} />
        <meshStandardMaterial color="#333" metalness={0.8} />
      </mesh>
      <mesh position={[0.2, 0.6, 0]}>
        <boxGeometry args={[0.4, 0.1, 0.1]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <pointLight position={[0, 1, 0]} intensity={1} color="cyan" distance={5} />
      <Html position={[0, 1.2, 0]} center>
        <div className="bg-black/80 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          {weapon.name}
        </div>
      </Html>
    </group>
  );
});

export const AttachmentPickup = React.memo(({ position, type, onPickup, playerPos, isInteracting, sfxVolume, masterVolume }: { 
  position: [number, number, number], 
  type: AttachmentType, 
  onPickup: (type: AttachmentType) => void, 
  playerPos: React.MutableRefObject<THREE.Vector3>, 
  isInteracting: boolean,
  sfxVolume: number,
  masterVolume: number
}) => {
  const attachment = ATTACHMENTS_DATA[type];
  const groupRef = useRef<THREE.Group>(null);
  const pickedUp = useRef(false);

  useFrame((state: any) => {
    if (!pickedUp.current && groupRef.current) {
      const now = state.clock.getElapsedTime();
      groupRef.current.rotation.y = now;
      groupRef.current.position.y = position[1] + Math.sin(now * 2) * 0.1;
      
      if (playerPos.current.distanceTo(groupRef.current.position) < 2 && isInteracting) {
        pickedUp.current = true;
        playPickupSound(sfxVolume, masterVolume);
        onPickup(type);
      }
    }
  });

  if (pickedUp.current) return null;

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#88f" metalness={0.5} />
      </mesh>
      <pointLight position={[0, 0.5, 0]} intensity={0.5} color="#88f" distance={2} />
      <Html position={[0, 1.0, 0]} center>
        <div className="bg-black/80 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          {attachment.name}
        </div>
      </Html>
    </group>
  );
});
