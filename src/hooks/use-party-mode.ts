'use client';

import { useState, useEffect } from 'react';

interface PartyModeState {
  isPartyMode: boolean;
  intensity: number; // 0-1, increases as midnight approaches
  hoursUntilMidnight: number;
  minutesUntilMidnight: number;
}

const TARGET = new Date(
  process.env.NEXT_PUBLIC_NEW_YEAR_TARGET || '2026-01-01T00:00:00+05:30'
);

export function usePartyMode(): PartyModeState {
  const [state, setState] = useState<PartyModeState>({
    isPartyMode: false,
    intensity: 0,
    hoursUntilMidnight: 24,
    minutesUntilMidnight: 0,
  });

  useEffect(() => {
    const updateState = (): void => {
      const now = new Date();
      const diff = TARGET.getTime() - now.getTime();

      if (diff <= 0) {
        // It's past midnight - full party mode!
        setState({
          isPartyMode: true,
          intensity: 1,
          hoursUntilMidnight: 0,
          minutesUntilMidnight: 0,
        });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Party mode activates within 3 hours of midnight
      const isPartyMode = hours < 3;

      // Intensity increases as we get closer (0 at 3 hours, 1 at midnight)
      // More dramatic increase in last hour
      let intensity = 0;
      if (hours < 3) {
        if (hours === 0) {
          // Last hour: rapid increase
          intensity = 0.7 + (1 - minutes / 60) * 0.3;
        } else {
          // 1-3 hours: gradual increase
          intensity = (3 - hours) / 3 * 0.7;
        }
      }

      setState({
        isPartyMode,
        intensity: Math.min(1, intensity),
        hoursUntilMidnight: hours,
        minutesUntilMidnight: minutes,
      });
    };

    updateState();
    const interval = setInterval(updateState, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return state;
}
