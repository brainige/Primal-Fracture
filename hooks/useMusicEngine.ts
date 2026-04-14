import { useRef, useEffect, useCallback } from 'react';
import { GameState } from '@/types';

/**
 * useMusicEngine — plays PrimalFracture.wav in a seamless loop.
 * Volume is controlled by settings.musicVolume × settings.masterVolume.
 * Music pauses when the game is paused / inventory open / game over.
 */
export function useMusicEngine(state: GameState) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initialized = useRef(false);

  // Create the audio element once when the game starts
  useEffect(() => {
    if (!state.gameStarted || initialized.current) return;
    initialized.current = true;

    const audio = new Audio('/PrimalFracture.wav');
    audio.loop = true;
    audio.volume = 0;          // start silent, fade in below
    audioRef.current = audio;

    // Browsers require a user gesture before play() works.
    // By this point the user has already clicked "Start Mission", so it's safe.
    const tryPlay = () => {
      audio.play().catch(() => {
        // If autoplay is still blocked, retry on next interaction
        const retry = () => { audio.play().catch(() => {}); window.removeEventListener('click', retry); };
        window.addEventListener('click', retry);
      });
    };
    tryPlay();

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      initialized.current = false;
    };
  }, [state.gameStarted]);

  // Volume sync — reacts to slider changes in real time
  useEffect(() => {
    if (!audioRef.current) return;
    const targetVol = (state.settings.musicVolume / 100) * (state.settings.masterVolume / 100);
    audioRef.current.volume = Math.max(0, Math.min(1, targetVol));
  }, [state.settings.musicVolume, state.settings.masterVolume]);

  // Pause / resume based on game state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const shouldPause =
      state.isPaused ||
      state.isInventoryOpen ||
      state.isGameOver ||
      !state.gameStarted;

    if (shouldPause) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [
    state.isPaused,
    state.isInventoryOpen,
    state.isGameOver,
    state.gameStarted,
  ]);

  // triggerBossDefeat — brief volume swell for narrative climax
  const triggerBossDefeat = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const base = audio.volume;
    audio.volume = Math.min(1, base * 1.5);
    setTimeout(() => { if (audioRef.current) audioRef.current.volume = base; }, 4000);
  }, []);

  return { triggerBossDefeat };
}
