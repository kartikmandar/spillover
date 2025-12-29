'use client';

import { useEffect, useState } from 'react';
import { useSound } from '@/providers/sound-provider';
import { useCountdown } from '@/hooks/use-countdown';
import confetti from 'canvas-confetti';

const TARGET = new Date(
  process.env.NEXT_PUBLIC_NEW_YEAR_TARGET || '2026-01-01T00:00:00+05:30'
);

interface NewYearTimerProps {
  variant?: 'full' | 'compact';
}

export function NewYearTimer({ variant = 'full' }: NewYearTimerProps) {
  const { timeLeft, isNewYear } = useCountdown(TARGET);
  const { playSound } = useSound();
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false);

  useEffect(() => {
    // Play countdown sounds in last 10 seconds
    if (
      timeLeft &&
      timeLeft.days === 0 &&
      timeLeft.hours === 0 &&
      timeLeft.minutes === 0 &&
      timeLeft.seconds <= 10 &&
      timeLeft.seconds > 0
    ) {
      playSound('countdown');
    }
  }, [timeLeft, playSound]);

  useEffect(() => {
    // Trigger confetti at midnight
    if (isNewYear && !hasTriggeredCelebration) {
      setHasTriggeredCelebration(true);
      triggerCelebration();
    }
  }, [isNewYear, hasTriggeredCelebration]);

  const triggerCelebration = (): void => {
    playSound('celebrate');

    // Fire confetti multiple times
    const duration = 10 * 1000;
    const end = Date.now() + duration;

    const frame = (): void => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  if (isNewYear) {
    return (
      <div className="text-center p-4 animate-pulse">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
          Happy New Year 2026!
        </h1>
      </div>
    );
  }

  if (!timeLeft) return null;

  if (variant === 'compact') {
    return (
      <div className="text-center text-muted-foreground">
        <p className="text-xs uppercase tracking-wider">New Year 2026 in</p>
        <p className="font-mono text-lg">
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{' '}
          {timeLeft.seconds}s
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-2">
      <p className="text-sm uppercase tracking-wider text-muted-foreground">
        New Year 2026 Countdown
      </p>
      <div className="flex justify-center gap-2">
        {[
          { value: timeLeft.days, label: 'Days' },
          { value: timeLeft.hours, label: 'Hours' },
          { value: timeLeft.minutes, label: 'Min' },
          { value: timeLeft.seconds, label: 'Sec' },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="text-3xl font-mono font-bold tabular-nums">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
