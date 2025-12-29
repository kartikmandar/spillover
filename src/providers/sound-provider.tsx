'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { loadSounds, playSound as playSoundFn, setMuted } from '@/lib/sounds';

type SoundName = 'vote' | 'submit' | 'reveal' | 'reaction' | 'countdown' | 'celebrate';

interface SoundContextType {
  muted: boolean;
  toggleMute: () => void;
  playSound: (name: SoundName) => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMutedState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSounds();
    setLoaded(true);

    // Check localStorage for mute preference
    const savedMuted = localStorage.getItem('spillover-muted') === 'true';
    setMutedState(savedMuted);
    setMuted(savedMuted);
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const newValue = !prev;
      setMuted(newValue);
      localStorage.setItem('spillover-muted', String(newValue));
      return newValue;
    });
  }, []);

  const playSound = useCallback(
    (name: SoundName) => {
      if (loaded && !muted) {
        playSoundFn(name);
      }
    },
    [loaded, muted]
  );

  return (
    <SoundContext.Provider value={{ muted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound(): SoundContextType {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within SoundProvider');
  }
  return context;
}
