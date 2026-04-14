import React from 'react';
import { EffectComposer, Bloom, Vignette, DepthOfField, FXAA } from '@react-three/postprocessing';

interface PostProcessingProps {
  quality: string;
  isAiming: boolean;
  enabled?: boolean;
}

export default function PostProcessing({ quality, isAiming, enabled = true }: PostProcessingProps) {
  if (!enabled || quality === 'Low') return null;

  const isUltra = quality === 'Ultra';
  const isHigh = quality === 'High' || isUltra;
  const showDof = isAiming && isHigh;

  // EffectComposer requires every child to be a real ReactElement — no false/null/comments.
  // Solution: two distinct composer trees, one with DoF and one without, toggled at the top level.
  if (showDof) {
    return (
      <EffectComposer multisampling={0}>
        <FXAA />
        <Bloom
          intensity={isUltra ? 0.5 : isHigh ? 0.25 : 0.15}
          luminanceThreshold={isUltra ? 0.78 : 0.85}
          luminanceSmoothing={0.9}
          mipmapBlur={isHigh}
          radius={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={isUltra ? 0.65 : 0.45} />
        <DepthOfField
          focusDistance={0.01}
          focalLength={0.018}
          bokehScale={isUltra ? 3 : 1.5}
        />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0}>
      <FXAA />
      <Bloom
        intensity={isUltra ? 0.5 : isHigh ? 0.25 : 0.15}
        luminanceThreshold={isUltra ? 0.78 : 0.85}
        luminanceSmoothing={0.9}
        mipmapBlur={isHigh}
        radius={0.4}
      />
      <Vignette eskil={false} offset={0.1} darkness={isUltra ? 0.65 : 0.45} />
    </EffectComposer>
  );
}
