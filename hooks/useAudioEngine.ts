import { WeaponType } from '@/types';

// --- Audio Engine ---
let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const playFireSound = (weaponType: WeaponType, isSilenced: boolean, sfxVolume: number = 100, masterVolume: number = 80) => {
  if (!audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;

  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);
  const finalVolume = 0.3 * (sfxVolume / 100) * (masterVolume / 100);
  gainNode.gain.setValueAtTime(finalVolume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  // Knife swoosh
  if (weaponType === WeaponType.KNIFE) {
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * Math.sin(t * Math.PI * 8);
    }
    const knifeNoise = ctx.createBufferSource();
    knifeNoise.buffer = buffer;
    const knifeFilter = ctx.createBiquadFilter();
    knifeFilter.type = 'bandpass';
    knifeFilter.frequency.setValueAtTime(2000, now);
    knifeFilter.Q.setValueAtTime(2, now);
    knifeNoise.connect(knifeFilter);
    knifeFilter.connect(gainNode);
    knifeNoise.start(now);
    knifeNoise.stop(now + 0.15);
    return;
  }

  const osc = ctx.createOscillator();
  const noise = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();

  if (isSilenced) {
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    noise.connect(filter);
    filter.connect(gainNode);
    noise.start(now);
    noise.stop(now + 0.05);
  } else {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(weaponType === WeaponType.SHOTGUN ? 100 : 200, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
    noise.buffer = noiseBuffer;

    osc.connect(gainNode);
    noise.connect(gainNode);
    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.2);
    noise.stop(now + 0.2);
  }
};

export const playReloadSound = (sfxVolume: number = 100, masterVolume: number = 80) => {
  if (!audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);
  const finalVolume = 0.15 * (sfxVolume / 100) * (masterVolume / 100);
  gainNode.gain.setValueAtTime(finalVolume, now);
  
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.setValueAtTime(400, now + 0.1);
  osc.connect(gainNode);
  osc.start(now);
  osc.stop(now + 0.2);
};

export const playMedikitSound = (sfxVolume: number = 100, masterVolume: number = 80) => {
  if (!audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);
  const finalVolume = 0.2 * (sfxVolume / 100) * (masterVolume / 100);
  gainNode.gain.setValueAtTime(finalVolume, now);
  
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.linearRampToValueAtTime(1000, now + 0.5);
  osc.connect(gainNode);
  osc.start(now);
  osc.stop(now + 0.5);
};

export const playHitSound = (sfxVolume: number = 100, masterVolume: number = 80) => {
  if (!audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);
  const finalVolume = 0.25 * (sfxVolume / 100) * (masterVolume / 100);
  gainNode.gain.setValueAtTime(finalVolume, now);
  
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.exponentialRampToValueAtTime(10, now + 0.2);
  osc.connect(gainNode);
  osc.start(now);
  osc.stop(now + 0.2);
};

export const playFootstep = (type: string, volume: number = 1, pitch: number = 1, sfxVolume: number = 100, masterVolume: number = 80) => {
  if (!audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;

  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);
  const finalVolume = volume * 0.05 * (sfxVolume / 100) * (masterVolume / 100);
  gainNode.gain.setValueAtTime(finalVolume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  if (type === 'jungle' || type === 'shore' || type === 'ruins') {
    // Soft organic crunch
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000 * pitch, now);
    
    noise.connect(filter);
    filter.connect(gainNode);
    noise.start(now);
    noise.stop(now + 0.1);
  } else if (type === 'port') {
    // Metallic concrete clank — two quick oscillator pops + mid-noise burst
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);
    osc.connect(gainNode);
    osc.start(now);
    osc.stop(now + 0.06);

    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800 * pitch, now);
    filter.Q.setValueAtTime(3, now);
    noise.connect(filter);
    filter.connect(gainNode);
    noise.start(now);
    noise.stop(now + 0.06);
  } else if (type === 'base') {
    // Dirt thud — lower pitch than concrete, with a soft noise tail
    const bufferSize = ctx.sampleRate * 0.09;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600 * pitch, now);
    noise.connect(filter);
    filter.connect(gainNode);
    noise.start(now);
    noise.stop(now + 0.09);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.09);
    osc.connect(gainNode);
    osc.start(now);
    osc.stop(now + 0.09);
  } else if (type === 'volcanic') {
    // Gritty crunch on volcanic rock
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() > 0.5 ? 1 : -1) * Math.random();
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(400 * pitch, now);
    noise.connect(filter);
    filter.connect(gainNode);
    noise.start(now);
    noise.stop(now + 0.08);
  } else {
    // Generic concrete thud (prison)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    osc.connect(gainNode);
    osc.start(now);
    osc.stop(now + 0.1);
  }
};

export const playPickupSound = (sfxVolume: number = 100, masterVolume: number = 80) => {
  if (!audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);
  const finalVolume = 0.15 * (sfxVolume / 100) * (masterVolume / 100);
  gainNode.gain.setValueAtTime(finalVolume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
  osc.connect(gainNode);
  osc.start(now);
  osc.stop(now + 0.15);
};

export const playKillStreakSound = (streak: number, sfxVolume: number = 100, masterVolume: number = 80) => {
  if (!audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);
  const finalVolume = 0.2 * (sfxVolume / 100) * (masterVolume / 100);
  gainNode.gain.setValueAtTime(finalVolume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  
  // Rising tone for streaks
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  const baseFreq = 400 + streak * 100;
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.3);
  osc.connect(gainNode);
  osc.start(now);
  osc.stop(now + 0.3);
};
