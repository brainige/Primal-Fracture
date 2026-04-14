import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Weapon, WeaponType, AttachmentType } from '@/types';

function MuzzleFlash({ active, isSilenced }: { active: boolean, isSilenced?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      if (active) {
        meshRef.current.visible = true;
        meshRef.current.scale.set(1, 1, 1);
      } else {
        meshRef.current.scale.multiplyScalar(0.5);
        if (meshRef.current.scale.x < 0.1) meshRef.current.visible = false;
      }
    }
  });

  const scaleMult = isSilenced ? 0.2 : 1;

  return (
    <mesh ref={meshRef} position={[0, 0.05, isSilenced ? -0.6 : -0.4]} visible={false} scale={[scaleMult, scaleMult, scaleMult]}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshBasicMaterial color="#ffcc00" transparent opacity={isSilenced ? 0.3 : 0.8} />
      {!isSilenced && <pointLight color="#ffcc00" intensity={3} distance={3} />}
    </mesh>
  );
}

export default function WeaponViewModel({ weapon, isAiming, muzzleFlash, isReloading, isHealing, recoilKick }: { 
  weapon: Weapon | undefined, 
  isAiming: boolean, 
  muzzleFlash: boolean, 
  isReloading: boolean, 
  isHealing: boolean,
  recoilKick: number 
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const aimTime = useRef(0);
  
  const targetPos = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const swayEuler = useRef(new THREE.Euler());
  const swayQuat = useRef(new THREE.Quaternion());
  const posSway = useRef(new THREE.Vector3());
  const reloadRot = useRef(new THREE.Euler());
  const reloadQuat = useRef(new THREE.Quaternion());
  const currentRecoil = useRef(0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Recoil animation
      currentRecoil.current = THREE.MathUtils.lerp(currentRecoil.current, recoilKick, 0.3);
      if (Math.abs(currentRecoil.current) < 0.001) currentRecoil.current = 0;

      if (isAiming) {
        aimTime.current += delta;
      } else {
        aimTime.current = 0;
      }

      targetPos.current.set(0.4, -0.3, -0.6);
      if (isAiming) {
        targetPos.current.set(0, -0.15, -0.4);
      }
      
      // Recoil offset
      targetPos.current.z += currentRecoil.current * 0.15;
      targetPos.current.y += currentRecoil.current * 0.05;
      
      if (isReloading) {
        targetPos.current.y -= 0.5;
        targetPos.current.z += 0.2;
      } else if (isHealing) {
        targetPos.current.y -= 1.0;
      }
      
      groupRef.current.position.copy(camera.position);
      groupRef.current.quaternion.copy(camera.quaternion);
      
      tempOffset.current.copy(targetPos.current).applyQuaternion(camera.quaternion);
      groupRef.current.position.add(tempOffset.current);
      
      const t = state.clock.getElapsedTime();
      if (!isAiming && !isReloading && !isHealing) {
        groupRef.current.position.y += Math.sin(t * 2) * 0.01;
        groupRef.current.position.x += Math.cos(t * 1) * 0.005;
      } else if (isAiming) {
        const swayIntensity = 0.001 + Math.min(aimTime.current * 0.0015, 0.012);
        const swaySpeed = 1.2;
        
        const rotSwayX = Math.sin(t * swaySpeed * 0.7) * (swayIntensity * 1.5);
        const rotSwayY = Math.cos(t * swaySpeed * 0.8) * (swayIntensity * 1.5);
        
        swayEuler.current.set(rotSwayX, rotSwayY, 0);
        swayQuat.current.setFromEuler(swayEuler.current);
        groupRef.current.quaternion.multiply(swayQuat.current);

        const posSwayX = Math.sin(t * swaySpeed) * (swayIntensity * 0.2);
        const posSwayY = Math.cos(t * swaySpeed * 1.1) * (swayIntensity * 0.2);
        posSway.current.set(posSwayX, posSwayY, 0).applyQuaternion(camera.quaternion);
        groupRef.current.position.add(posSway.current);
      }

      if (isReloading) {
        reloadRot.current.set(Math.sin(t * 10) * 0.1, 0, 0.2);
        reloadQuat.current.setFromEuler(reloadRot.current);
        groupRef.current.quaternion.multiply(reloadQuat.current);
      }
      
      // Recoil rotation
      if (currentRecoil.current > 0.01) {
        const recoilEuler = new THREE.Euler(-currentRecoil.current * 0.08, 0, 0);
        const recoilQ = new THREE.Quaternion().setFromEuler(recoilEuler);
        groupRef.current.quaternion.multiply(recoilQ);
      }
    }
  });

  if (!weapon) return null;

  const hasScope = weapon.attachments.includes(AttachmentType.SCOPE);
  const hasSilencer = weapon.attachments.includes(AttachmentType.SILENCER);
  const hasExtMag = weapon.attachments.includes(AttachmentType.EXTENDED_MAG);

  const isPistol = weapon.type === WeaponType.PISTOL;
  const isShotgun = weapon.type === WeaponType.SHOTGUN;
  const isRifle = weapon.type === WeaponType.RIFLE;
  const isAssault = weapon.type === WeaponType.ASSAULT_RIFLE;
  const isKnife = weapon.type === WeaponType.KNIFE;

  if (isKnife) {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0.02, -0.18]}>
          <boxGeometry args={[0.03, 0.12, 0.35]} />
          <meshStandardMaterial color="#999" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0.02, 0.02, -0.18]}>
          <boxGeometry args={[0.005, 0.1, 0.33]} />
          <meshStandardMaterial color="#ccc" metalness={1} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.08, 0.03, 0.04]} />
          <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.04, 0.12]}>
          <boxGeometry args={[0.04, 0.1, 0.14]} />
          <meshStandardMaterial color="#2b1d0e" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.04, 0.12]}>
          <boxGeometry args={[0.045, 0.03, 0.12]} />
          <meshStandardMaterial color="#1a0f05" roughness={0.95} />
        </mesh>
      </group>
    );
  }

  const bodyArgs: [number, number, number] = isPistol ? [0.08, 0.12, 0.3] : 
                                             isShotgun ? [0.12, 0.15, 0.8] :
                                             isRifle ? [0.08, 0.1, 1.2] :
                                             [0.1, 0.15, 0.7];
  
  const bodyColor = isRifle || isShotgun ? "#3e2723" : "#1a1a1a";

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={bodyArgs} />
        <meshStandardMaterial color={bodyColor} metalness={isAssault || isPistol ? 0.9 : 0.4} roughness={0.3} />
      </mesh>
      
      {(isShotgun || isRifle || isAssault) && (
        <mesh position={[0, 0.02, -bodyArgs[2]/2 - 0.15]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.02, 0.5]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
        </mesh>
      )}

      <mesh position={[0, -0.12, 0.1]}>
        <boxGeometry args={[0.06, 0.18, 0.08]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>

      {isAssault && (
        <mesh position={[0, -0.18, -0.1]}>
          <boxGeometry args={[0.05, 0.25, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.6} />
        </mesh>
      )}

      {hasScope && (
        <group position={[0, 0.12, -0.05]}>
          {/* Main scope tube */}
          <mesh rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.28, 12]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Front objective bell (wider) */}
          <mesh position={[0, 0, -0.15]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.025, 0.06, 12]} />
            <meshStandardMaterial color="#222" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Front lens — transparent blue tint */}
          <mesh position={[0, 0, -0.18]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.005, 12]} />
            <meshStandardMaterial color="#88ccff" transparent opacity={0.3} metalness={0.9} roughness={0.05} />
          </mesh>
          {/* Eyepiece */}
          <mesh position={[0, 0, 0.15]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.032, 0.04, 12]} />
            <meshStandardMaterial color="#222" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Scope rings / mounts */}
          <mesh position={[0, -0.03, -0.06]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.03, 8]} />
            <meshStandardMaterial color="#333" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.03, 0.06]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.03, 8]} />
            <meshStandardMaterial color="#333" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Magnification dial */}
          <mesh position={[0.03, 0, 0.02]}>
            <cylinderGeometry args={[0.015, 0.015, 0.012, 8]} />
            <meshStandardMaterial color="#444" metalness={0.6} roughness={0.5} />
          </mesh>
        </group>
      )}
      {hasSilencer && (
        <mesh position={[0, 0.02, -bodyArgs[2]/2 - 0.45]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.35]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.4} />
        </mesh>
      )}
      {hasExtMag && (
        <mesh position={[0, -0.28, isAssault ? -0.1 : 0.1]}>
          <boxGeometry args={[0.05, 0.15, 0.09]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.6} />
        </mesh>
      )}
      {!hasScope && (
        <mesh position={[0, bodyArgs[1]/2 + 0.02, -bodyArgs[2]/2 + 0.05]}>
          <boxGeometry args={[0.01, 0.04, 0.02]} />
          <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
        </mesh>
      )}
      <MuzzleFlash active={muzzleFlash} isSilenced={hasSilencer} />
    </group>
  );
}
