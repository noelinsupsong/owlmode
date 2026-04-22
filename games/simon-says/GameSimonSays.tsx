'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const COLORS = ['emerald', 'rose', 'amber', 'sky'] as const;
const STORAGE_KEY = 'highScore:simon-says';

const COLOR_BG: Record<(typeof COLORS)[number], string> = {
  emerald: 'bg-emerald-700',
  rose: 'bg-rose-700',
  amber: 'bg-amber-600',
  sky: 'bg-sky-700',
};
const COLOR_BG_BRIGHT: Record<(typeof COLORS)[number], string> = {
  emerald: 'bg-emerald-300',
  rose: 'bg-rose-300',
  amber: 'bg-amber-300',
  sky: 'bg-sky-300',
};

export default function GameSimonSays() {
  const t = useTranslations('common');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [showing, setShowing] = useState(false);
  const [over, setOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const seqRef = useRef<number[]>([]);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
  }, []);

  const playSequence = useCallback(async (seq: number[]) => {
    setShowing(true);
    setActive(null);
    await new Promise((r) => setTimeout(r, 600));
    for (const i of seq) {
      setActive(i);
      await new Promise((r) => setTimeout(r, 500));
      setActive(null);
      await new Promise((r) => setTimeout(r, 200));
    }
    setShowing(false);
  }, []);

  const start = useCallback(() => {
    const seq = [Math.floor(Math.random() * 4)];
    seqRef.current = seq;
    setSequence(seq);
    setPlayerIdx(0);
    setOver(false);
    playSequence(seq);
  }, [playSequence]);

  function handleClick(i: number) {
    if (showing || over) return;
    if (sequence.length === 0) return;
    setActive(i);
    setTimeout(() => setActive(null), 200);
    if (sequence[playerIdx] !== i) {
      setOver(true);
      const score = sequence.length - 1;
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem(STORAGE_KEY, String(score));
      }
      return;
    }
    if (playerIdx === sequence.length - 1) {
      const next = [...sequence, Math.floor(Math.random() * 4)];
      seqRef.current = next;
      setSequence(next);
      setPlayerIdx(0);
      setTimeout(() => playSequence(next), 600);
    } else {
      setPlayerIdx((p) => p + 1);
    }
  }

  const round = sequence.length;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">Round: {round}</span>
        <span className="text-neutral-400">
          {t('highScore')}: <span className="text-neutral-100">{highScore}</span>
        </span>
      </div>

      {over && (
        <div className="rounded bg-rose-500/20 px-4 py-2 font-mono text-rose-300">
          ❌ Wrong! Round {round - 1}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {COLORS.map((color, i) => (
          <button
            key={color}
            onClick={() => handleClick(i)}
            disabled={showing || over || sequence.length === 0}
            className={`h-24 w-24 rounded-lg transition sm:h-32 sm:w-32 ${
              active === i ? COLOR_BG_BRIGHT[color] : COLOR_BG[color]
            } disabled:cursor-not-allowed`}
            aria-label={color}
          />
        ))}
      </div>

      <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {sequence.length === 0 ? t('start') : t('restart')}
      </button>
    </div>
  );
}
