'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCooldownReturn {
  canAct: boolean;
  timeLeft: number;
  formatTimeLeft: () => string;
}

export function useCooldown(
  lastActionTime: Date | null,
  cooldownMs: number
): UseCooldownReturn {
  // Convert Date to timestamp - use primitive value for stable comparison
  const timestamp = lastActionTime ? new Date(lastActionTime).getTime() : null;

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canAct, setCanAct] = useState<boolean>(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    // Only proceed if the timestamp actually changed
    if (lastTimestampRef.current === timestamp) {
      return;
    }
    lastTimestampRef.current = timestamp;

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!timestamp) {
      setCanAct(true);
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = (): boolean => {
      const elapsed = Date.now() - timestamp;
      const remaining = Math.max(0, cooldownMs - elapsed);

      if (remaining <= 0) {
        setCanAct(true);
        setTimeLeft(0);
        return false;
      }

      setCanAct(false);
      setTimeLeft(remaining);
      return true;
    };

    // Initial calculation
    const shouldContinue = calculateTimeLeft();

    if (shouldContinue) {
      timerRef.current = setInterval(() => {
        if (!calculateTimeLeft()) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timestamp, cooldownMs]);

  const formatTimeLeft = useCallback((): string => {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [timeLeft]);

  return { canAct, timeLeft, formatTimeLeft };
}
