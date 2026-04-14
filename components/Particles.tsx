import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

// Blood splatter particles — triggered by 'blood-splatter' custom events
export function BloodParticles({ quality }: { quality: string }) {
  const maxParticles = quality === 'Low' ? 20 : quality === 'Medium' ? 40 : 80;
  const particles = useRef<Particle[]>([]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObj = useRef(new THREE.Object3D());
  const tempColor = useRef(new THREE.Color());
  const tempVel = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleBlood = (e: any) => {
      const pos = e.detail.position;
      const count = quality === 'Low' ? 3 : quality === 'Medium' ? 6 : 10;
      for (let i = 0; i < count; i++) {
        if (particles.current.length >= maxParticles) {
          particles.current.shift();
        }
        particles.current.push({
          position: new THREE.Vector3(pos[0], pos[1], pos[2]),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            Math.random() * 3,
            (Math.random() - 0.5) * 4
          ),
          life: 1.0,
          maxLife: 0.5 + Math.random() * 0.5,
        });
      }
    };
    window.addEventListener('blood-splatter', handleBlood);
    return () => window.removeEventListener('blood-splatter', handleBlood);
  }, [quality, maxParticles]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.1);
    
    // Update particles
    particles.current = particles.current.filter(p => {
      p.life -= dt / p.maxLife;
      p.velocity.y -= 9.8 * dt; // gravity
      tempVel.current.copy(p.velocity).multiplyScalar(dt);
      p.position.add(tempVel.current);
      return p.life > 0;
    });

    // Update instances
    for (let i = 0; i < maxParticles; i++) {
      if (i < particles.current.length) {
        const p = particles.current[i];
        tempObj.current.position.copy(p.position);
        const scale = p.life * 0.08;
        tempObj.current.scale.set(scale, scale, scale);
        tempObj.current.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.current.matrix);
        
        // Red to dark red fade
        tempColor.current.setHSL(0, 1, 0.15 + p.life * 0.35);
        meshRef.current.setColorAt(i, tempColor.current);
      } else {
        tempObj.current.position.set(0, -100, 0);
        tempObj.current.scale.set(0, 0, 0);
        tempObj.current.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.current.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const geo = useMemo(() => new THREE.SphereGeometry(1, 4, 4), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#cc0000' }), []);

  return (
    <instancedMesh ref={meshRef} args={[geo, mat, maxParticles]} frustumCulled={false} />
  );
}

// Shell casing particles — triggered by 'shell-eject' custom events
export function ShellParticles({ quality }: { quality: string }) {
  if (quality === 'Low') return null;
  
  const maxParticles = quality === 'Medium' ? 10 : 20;
  const particles = useRef<Particle[]>([]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObj = useRef(new THREE.Object3D());
  const tempVel = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleShell = (e: any) => {
      const pos = e.detail.position;
      if (particles.current.length >= maxParticles) {
        particles.current.shift();
      }
      particles.current.push({
        position: new THREE.Vector3(pos[0], pos[1], pos[2]),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2 + 1,
          Math.random() * 2 + 1,
          (Math.random() - 0.5) * 2
        ),
        life: 1.0,
        maxLife: 1.0,
      });
    };
    window.addEventListener('shell-eject', handleShell);
    return () => window.removeEventListener('shell-eject', handleShell);
  }, [maxParticles]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.1);
    
    particles.current = particles.current.filter(p => {
      p.life -= dt / p.maxLife;
      p.velocity.y -= 9.8 * dt;
      tempVel.current.copy(p.velocity).multiplyScalar(dt);
      p.position.add(tempVel.current);
      if (p.position.y < 0) {
        p.position.y = 0;
        p.velocity.set(0, 0, 0);
      }
      return p.life > 0;
    });

    for (let i = 0; i < maxParticles; i++) {
      if (i < particles.current.length) {
        const p = particles.current[i];
        tempObj.current.position.copy(p.position);
        tempObj.current.rotation.set(p.life * 10, p.life * 5, 0);
        tempObj.current.scale.set(0.03, 0.03, 0.06);
        tempObj.current.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.current.matrix);
      } else {
        tempObj.current.position.set(0, -100, 0);
        tempObj.current.scale.set(0, 0, 0);
        tempObj.current.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.current.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const geo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 6), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c4a000', metalness: 0.9, roughness: 0.3 }), []);

  return (
    <instancedMesh ref={meshRef} args={[geo, mat, maxParticles]} frustumCulled={false} />
  );
}

// Muzzle smoke — triggered by 'muzzle-smoke' custom events
export function MuzzleSmokeParticles({ quality }: { quality: string }) {
  if (quality === 'Low') return null;
  
  const maxParticles = quality === 'Medium' ? 15 : 30;
  const particles = useRef<Particle[]>([]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObj = useRef(new THREE.Object3D());
  const tempVel = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleSmoke = (e: any) => {
      const pos = e.detail.position;
      const count = quality === 'Medium' ? 5 : 10;
      for (let i = 0; i < count; i++) {
        if (particles.current.length >= maxParticles) {
          particles.current.shift();
        }
        particles.current.push({
          position: new THREE.Vector3(pos[0], pos[1], pos[2]),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            Math.random() * 0.5 + 0.2,
            (Math.random() - 0.5) * 0.5
          ),
          life: 1.0,
          maxLife: 0.3 + Math.random() * 0.3,
        });
      }
    };
    window.addEventListener('muzzle-smoke', handleSmoke);
    return () => window.removeEventListener('muzzle-smoke', handleSmoke);
  }, [quality, maxParticles]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.1);
    
    particles.current = particles.current.filter(p => {
      p.life -= dt / p.maxLife;
      p.position.add(tempVel.current.copy(p.velocity).multiplyScalar(dt));
      return p.life > 0;
    });

    for (let i = 0; i < maxParticles; i++) {
      if (i < particles.current.length) {
        const p = particles.current[i];
        tempObj.current.position.copy(p.position);
        const scale = (1 - p.life) * 0.15 + 0.02;
        tempObj.current.scale.set(scale, scale, scale);
        tempObj.current.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.current.matrix);
      } else {
        tempObj.current.position.set(0, -100, 0);
        tempObj.current.scale.set(0, 0, 0);
        tempObj.current.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.current.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const geo = useMemo(() => new THREE.SphereGeometry(1, 6, 6), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#888888', transparent: true, opacity: 0.3 }), []);

  return (
    <instancedMesh ref={meshRef} args={[geo, mat, maxParticles]} frustumCulled={false} />
  );
}
