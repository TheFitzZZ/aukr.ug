import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { toLocalMoment } from '@aukrug/content';

/** Current time, updated every minute and when the app returns to the foreground. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [intervalMs]);
  return now;
}

/** Today's date (YYYY-MM-DD) at the restaurant. */
export function useToday(): string {
  return toLocalMoment(useNow()).date;
}
