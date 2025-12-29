'use client';

import { useCooldown } from '@/hooks/use-cooldown';
import { Progress } from '@/components/ui/progress';

interface CooldownTimerProps {
  lastActionTime: Date | null;
  cooldownMs: number;
  label?: string;
}

export function CooldownTimer({
  lastActionTime,
  cooldownMs,
  label = 'Next submission in',
}: CooldownTimerProps) {
  const { canAct, timeLeft, formatTimeLeft } = useCooldown(
    lastActionTime,
    cooldownMs
  );

  if (canAct) {
    return null;
  }

  const progress = ((cooldownMs - timeLeft) / cooldownMs) * 100;

  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{formatTimeLeft()}</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
