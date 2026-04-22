'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true if the device most likely uses touch as its primary pointer.
 * Initial value is null until detection runs (avoids SSR mismatch).
 */
export function useIsTouchDevice(): boolean | null {
  const [isTouch, setIsTouch] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detect = () => {
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouch(coarse || hasTouch);
    };
    detect();
    const mq = window.matchMedia?.('(pointer: coarse)');
    if (mq?.addEventListener) {
      mq.addEventListener('change', detect);
      return () => mq.removeEventListener('change', detect);
    }
  }, []);

  return isTouch;
}
