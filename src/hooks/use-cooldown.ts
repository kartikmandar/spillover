'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseCooldownReturn {
  canAct: boolean;
  timeLeft: number;
  formatTimeLeft: () => string;
}

export function useCooldown(
  lastActionTime: Date | null,
  cooldownMs: number
): UseCooldownReturn {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canAct, setCanAct] = useState(true);

  useEffect(() => {
    if (!lastActionTime) {
      setCanAct(true);
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = (): boolean => {
      const elapsed = Date.now() - new Date(lastActionTime).getTime();
      const remaining = cooldownMs - elapsed;

      if (remaining <= 0) {
        setCanAct(true);
        setTimeLeft(0);
        return false;
      }

      setCanAct(false);
      setTimeLeft(remaining);
      return true;
    };

    if (!calculateTimeLeft()) return;

    const timer = setInterval(() => {
      if (!calculateTimeLeft()) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lastActionTime, cooldownMs]);

  const formatTimeLeft = useCallback((): string => {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [timeLeft]);

  return { canAct, timeLeft, formatTimeLeft };
}
