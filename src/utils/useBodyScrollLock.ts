import { useEffect } from 'react';

// Counter to handle multiple stacked modals/drawers safely
let lockCount = 0;
let originalOverflow = '';
let originalOverscroll = '';

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      originalOverscroll = document.body.style.overscrollBehavior;
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    }
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow || '';
        document.body.style.overscrollBehavior = originalOverscroll || '';
      }
    };
  }, [isLocked]);
}
