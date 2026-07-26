import { useEffect, useState } from 'react';

/**
 * Horloge de rendu : tick régulier quand l'app est visible, resynchronisation
 * immédiate au retour au premier plan. Les durées se calculent TOUJOURS par
 * rapport à un timestamp de fin/départ stocké — jamais en comptant les ticks.
 */
export function useNow(intervalMs = 250, active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    }, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs, active]);
  return now;
}
