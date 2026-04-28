'use client';

import { useIsTouchDevice } from '@/hooks/useDevice';

type Preset =
  | 'dpad'
  | 'dpad-fire'
  | 'dpad-bomb'
  | 'lr'
  | 'lr-fire'
  | 'lr-jump'
  | 'jump-duck'
  | 'updown'
  | 'rotate-thrust-fire'
  | 'block-stack';

function pressKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}
function releaseKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
}

function PadButton({
  label,
  k,
  size = 'h-14 w-14 text-2xl',
  variant = 'dir',
}: {
  label: string;
  k: string;
  size?: string;
  variant?: 'dir' | 'fire' | 'jump';
}) {
  const variantClass =
    variant === 'fire'
      ? 'bg-rose-500/80 text-neutral-50 active:bg-rose-400'
      : variant === 'jump'
        ? 'bg-amber-500/80 text-neutral-900 active:bg-amber-400'
        : 'bg-neutral-700/80 text-neutral-50 active:bg-amber-400 active:text-neutral-900';
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        pressKey(k);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        releaseKey(k);
      }}
      onPointerCancel={() => releaseKey(k)}
      onPointerLeave={() => releaseKey(k)}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex select-none items-center justify-center rounded-full font-mono shadow-md transition-colors touch-manipulation ${variantClass} ${size}`}
    >
      {label}
    </button>
  );
}

function DPad() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div />
      <PadButton label="↑" k="ArrowUp" />
      <div />
      <PadButton label="←" k="ArrowLeft" />
      <div />
      <PadButton label="→" k="ArrowRight" />
      <div />
      <PadButton label="↓" k="ArrowDown" />
      <div />
    </div>
  );
}

function LR() {
  return (
    <div className="flex gap-3">
      <PadButton label="←" k="ArrowLeft" />
      <PadButton label="→" k="ArrowRight" />
    </div>
  );
}

export default function TouchControls({ preset }: { preset: Preset }) {
  const isTouch = useIsTouchDevice();
  if (!isTouch) return null;

  let body: React.ReactNode = null;

  switch (preset) {
    case 'dpad':
      body = <DPad />;
      break;
    case 'dpad-fire':
      body = (
        <>
          <DPad />
          <PadButton label="🔥" k=" " variant="fire" size="h-16 w-16 text-2xl" />
        </>
      );
      break;
    case 'dpad-bomb':
      body = (
        <>
          <DPad />
          <PadButton label="💣" k=" " variant="fire" size="h-16 w-16 text-2xl" />
        </>
      );
      break;
    case 'lr':
      body = <LR />;
      break;
    case 'lr-fire':
      body = (
        <>
          <LR />
          <PadButton label="🔥" k=" " variant="fire" size="h-16 w-16 text-2xl" />
        </>
      );
      break;
    case 'lr-jump':
      body = (
        <>
          <LR />
          <PadButton label="⤴" k=" " variant="jump" size="h-16 w-16 text-2xl" />
        </>
      );
      break;
    case 'jump-duck':
      body = (
        <>
          <PadButton label="↓" k="ArrowDown" size="h-14 w-14 text-2xl" />
          <PadButton label="⤴" k=" " variant="jump" size="h-16 w-16 text-2xl" />
        </>
      );
      break;
    case 'updown':
      body = (
        <div className="flex flex-col gap-2">
          <PadButton label="↑" k="ArrowUp" />
          <PadButton label="↓" k="ArrowDown" />
        </div>
      );
      break;
    case 'rotate-thrust-fire':
      body = (
        <>
          <div className="flex gap-3">
            <PadButton label="←" k="ArrowLeft" />
            <PadButton label="↑" k="ArrowUp" variant="jump" />
            <PadButton label="→" k="ArrowRight" />
          </div>
          <PadButton label="🔥" k=" " variant="fire" size="h-16 w-16 text-2xl" />
        </>
      );
      break;
    case 'block-stack':
      body = (
        <>
          <div className="flex gap-3">
            <PadButton label="←" k="ArrowLeft" />
            <PadButton label="↻" k="ArrowUp" variant="jump" />
            <PadButton label="→" k="ArrowRight" />
            <PadButton label="↓" k="ArrowDown" />
          </div>
          <PadButton label="⤓" k=" " variant="fire" size="h-16 w-16 text-2xl" />
        </>
      );
      break;
  }

  return (
    <div className="mt-4 flex w-full items-center justify-around gap-6 px-2">
      {body}
    </div>
  );
}
