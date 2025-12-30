'use client';

import { useEffect, useState } from 'react';
import { useSound } from '@/providers/sound-provider';
import { useCountdown } from '@/hooks/use-countdown';
import { usePartyMode } from '@/hooks/use-party-mode';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const TARGET = new Date(
  process.env.NEXT_PUBLIC_NEW_YEAR_TARGET || '2026-01-01T00:00:00+05:30'
);

interface NewYearTimerProps {
  variant?: 'full' | 'compact';
}

const CELEBRATION_KEY = 'spillover_celebration_triggered';

export function NewYearTimer({ variant = 'full' }: NewYearTimerProps) {
  const { timeLeft, isNewYear } = useCountdown(TARGET);
  const { playSound } = useSound();
  const { isPartyMode, intensity } = usePartyMode();
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(() => {
    // Check localStorage on initial load
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CELEBRATION_KEY) === 'true';
    }
    return false;
  });

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
    // Trigger confetti at midnight - only once per session
    if (isNewYear && !hasTriggeredCelebration) {
      setHasTriggeredCelebration(true);
      localStorage.setItem(CELEBRATION_KEY, 'true');
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

  // Determine hype level based on time remaining
  const getHypeLevel = (): 'none' | 'low' | 'medium' | 'high' | 'extreme' => {
    if (!timeLeft) return 'none';
    if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 1) return 'extreme';
    if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 10) return 'high';
    if (timeLeft.days === 0 && timeLeft.hours < 1) return 'medium';
    if (timeLeft.days === 0 && timeLeft.hours < 3) return 'low';
    return 'none';
  };

  const hypeLevel = getHypeLevel();

  if (isNewYear) {
    return (
      <div className="text-center p-4 animate-pulse">
        <h1 className="text-4xl font-bold text-shimmer">
          Happy New Year 2026!
        </h1>
        <p className="text-lg text-muted-foreground mt-2">🎉 Let&apos;s gooo! 🎉</p>
      </div>
    );
  }

  if (!timeLeft) return null;

  if (variant === 'compact') {
    return (
      <div className={cn(
        "text-center text-muted-foreground",
        isPartyMode && "card-glow rounded-lg p-2"
      )}>
        <p className={cn(
          "text-xs uppercase tracking-wider",
          hypeLevel === 'extreme' && "text-shimmer"
        )}>
          New Year 2026 in
        </p>
        <p className={cn(
          "font-mono text-lg",
          hypeLevel === 'high' && "countdown-hype",
          hypeLevel === 'extreme' && "countdown-hype-intense text-xl"
        )}>
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{' '}
          {timeLeft.seconds}s
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "text-center space-y-2 p-4 rounded-lg transition-all duration-500",
      isPartyMode && intensity > 0.5 && "card-glow",
      hypeLevel === 'extreme' && "party-gradient-intense"
    )}>
      <p className={cn(
        "text-sm uppercase tracking-wider text-muted-foreground transition-all",
        hypeLevel === 'extreme' && "text-shimmer text-base font-bold"
      )}>
        {hypeLevel === 'extreme' ? '🎆 ALMOST THERE! 🎆' :
         hypeLevel === 'high' ? '🔥 Get Ready! 🔥' :
         hypeLevel === 'medium' ? '⚡ Less than an hour!' :
         'New Year 2026 Countdown'}
      </p>
      <div className={cn(
        "flex justify-center gap-2",
        hypeLevel === 'high' && "countdown-hype",
        hypeLevel === 'extreme' && "countdown-hype-intense"
      )}>
        {[
          { value: timeLeft.days, label: 'Days' },
          { value: timeLeft.hours, label: 'Hours' },
          { value: timeLeft.minutes, label: 'Min' },
          { value: timeLeft.seconds, label: 'Sec' },
        ].map(({ value, label }) => (
          <div key={label} className={cn(
            "flex flex-col items-center p-2 rounded-md transition-all",
            isPartyMode && "bg-primary/10",
            hypeLevel === 'extreme' && "bg-primary/20"
          )}>
            <span className={cn(
              "text-3xl font-mono font-bold tabular-nums transition-all",
              hypeLevel === 'high' && "text-4xl text-orange-500",
              hypeLevel === 'extreme' && "text-5xl text-shimmer"
            )}>
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      {isPartyMode && (
        <p className="text-xs text-purple-400 animate-pulse">
          🎉 Party mode activated! 🎉
        </p>
      )}
    </div>
  );
}
