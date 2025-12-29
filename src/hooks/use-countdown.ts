'use client';

import { useState, useEffect, useCallback } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface UseCountdownReturn {
  timeLeft: TimeLeft | null;
  isNewYear: boolean;
}

export function useCountdown(targetDate: Date): UseCountdownReturn {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isNewYear, setIsNewYear] = useState(false);

  const calculateTimeLeft = useCallback((): TimeLeft | null => {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    if (difference <= 0) {
      return null;
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }, [targetDate]);

  useEffect(() => {
    // Initial calculation
    const initial = calculateTimeLeft();
    setTimeLeft(initial);
    if (!initial) {
      setIsNewYear(true);
      return;
    }

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (!newTimeLeft) {
        setIsNewYear(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return { timeLeft, isNewYear };
}
