'use client';

import { useMemo, useState } from 'react';
import { useMessages } from 'next-intl';
import { useIsTouchDevice } from '@/hooks/useDevice';

type Mode = 'auto' | 'pc' | 'mobile';

export default function GameControls({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const messages = useMessages() as Record<string, unknown>;
  const isTouch = useIsTouchDevice();
  const [mode, setMode] = useState<Mode>('auto');

  const effective: 'pc' | 'mobile' =
    mode === 'auto' ? (isTouch ? 'mobile' : 'pc') : mode;

  const text = useMemo(() => {
    const games = (messages.games ?? {}) as Record<string, unknown>;
    const game = (games[slug] ?? {}) as Record<string, unknown>;
    const controls = game.controls;

    if (typeof controls === 'string') return controls;
    if (controls && typeof controls === 'object') {
      const obj = controls as Record<string, string>;
      return obj[effective] ?? obj.pc ?? obj.mobile ?? '';
    }
    return '';
  }, [messages, slug, effective]);

  const heading = locale === 'ko' ? '조작법 · 룰' : 'How to play';
  const autoLabel = locale === 'ko' ? '자동' : 'Auto';
  const pcLabel = locale === 'ko' ? 'PC' : 'PC';
  const mobileLabel = locale === 'ko' ? '모바일' : 'Mobile';

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-300">
          {heading}
        </h2>
        <div className="flex gap-1 font-mono text-[10px]">
          <button
            onClick={() => setMode('auto')}
            className={`rounded px-2 py-0.5 ${mode === 'auto' ? 'bg-amber-500 text-neutral-900' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
          >
            {autoLabel}
            {mode === 'auto' && isTouch !== null && ` · ${isTouch ? mobileLabel : pcLabel}`}
          </button>
          <button
            onClick={() => setMode('pc')}
            className={`rounded px-2 py-0.5 ${mode === 'pc' ? 'bg-amber-500 text-neutral-900' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
          >
            🖥 {pcLabel}
          </button>
          <button
            onClick={() => setMode('mobile')}
            className={`rounded px-2 py-0.5 ${mode === 'mobile' ? 'bg-amber-500 text-neutral-900' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
          >
            📱 {mobileLabel}
          </button>
        </div>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-300 sm:text-base">
        {text}
      </p>
    </div>
  );
}
