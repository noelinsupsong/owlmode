'use client';

import { useRef, useState, useEffect } from 'react';

const BASE_SIZE = 144;
const KNOB_SIZE = 60;
const MAX_DIST = (BASE_SIZE - KNOB_SIZE) / 2;
const THRESHOLD = MAX_DIST * 0.3;

const ALL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] as const;

function dispatchKeyDown(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}
function dispatchKeyUp(key: string) {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
}

export default function VirtualJoystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const activeKeysRef = useRef<Set<string>>(new Set());

  const press = (k: string) => {
    if (activeKeysRef.current.has(k)) return;
    activeKeysRef.current.add(k);
    dispatchKeyDown(k);
  };
  const release = (k: string) => {
    if (!activeKeysRef.current.has(k)) return;
    activeKeysRef.current.delete(k);
    dispatchKeyUp(k);
  };
  const releaseAll = () => {
    for (const k of Array.from(activeKeysRef.current)) release(k);
  };

  useEffect(() => {
    const set = activeKeysRef.current;
    return () => {
      for (const k of Array.from(set)) dispatchKeyUp(k);
      set.clear();
    };
  }, []);

  function updateFromXY(clientX: number, clientY: number) {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > MAX_DIST) {
      dx = (dx / dist) * MAX_DIST;
      dy = (dy / dist) * MAX_DIST;
    }
    setKnobPos({ x: dx, y: dy });

    if (Math.hypot(dx, dy) < THRESHOLD) {
      for (const k of ALL_KEYS) release(k);
      return;
    }

    if (dx < -THRESHOLD) press('ArrowLeft');
    else release('ArrowLeft');
    if (dx > THRESHOLD) press('ArrowRight');
    else release('ArrowRight');
    if (dy < -THRESHOLD) press('ArrowUp');
    else release('ArrowUp');
    if (dy > THRESHOLD) press('ArrowDown');
    else release('ArrowDown');
  }

  function handleEnd() {
    setKnobPos({ x: 0, y: 0 });
    releaseAll();
  }

  // ── Mouse: track on window so drag works outside the base ────────
  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    updateFromXY(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => updateFromXY(ev.clientX, ev.clientY);
    const onUp = () => {
      handleEnd();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // ── Touch: React handlers (each touch sticks to the source element) ─
  function onTouchStart(e: React.TouchEvent) {
    e.preventDefault();
    const t = e.touches[0];
    if (t) updateFromXY(t.clientX, t.clientY);
  }
  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    const t = e.touches[0];
    if (t) updateFromXY(t.clientX, t.clientY);
  }

  return (
    <div
      ref={baseRef}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onContextMenu={(e) => e.preventDefault()}
      className="relative flex select-none items-center justify-center rounded-full border-2 border-neutral-700 bg-neutral-800/70 shadow-inner"
      style={{ width: BASE_SIZE, height: BASE_SIZE, touchAction: 'none' }}
    >
      <div className="pointer-events-none absolute h-2 w-2 rounded-full bg-neutral-700" />
      <div
        className="pointer-events-none absolute rounded-full bg-amber-500 shadow-lg ring-2 ring-amber-300/50"
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition:
            knobPos.x === 0 && knobPos.y === 0
              ? 'transform 120ms ease-out'
              : 'none',
        }}
      />
    </div>
  );
}
