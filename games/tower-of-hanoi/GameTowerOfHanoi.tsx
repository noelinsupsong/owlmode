'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const STORAGE_KEY = 'highScore:tower-of-hanoi';
const COLORS = ['#ef4444', '#f97316', '#facc15', '#84cc16', '#06b6d4', '#3b82f6', '#a855f7'];

export default function GameTowerOfHanoi() {
  const t = useTranslations('common');
  const [diskCount, setDiskCount] = useState(5);
  const [pegs, setPegs] = useState<number[][]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState<Record<number, number>>({});

  const reset = useCallback((n: number) => {
    setPegs([Array.from({ length: n }, (_, i) => n - i), [], []]);
    setSelected(null);
    setMoves(0);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setBestMoves(JSON.parse(stored));
  }, []);

  useEffect(() => {
    reset(diskCount);
  }, [diskCount, reset]);

  const won = pegs[2]?.length === diskCount;
  const minMoves = (1 << diskCount) - 1;

  useEffect(() => {
    if (!won) return;
    const cur = bestMoves[diskCount];
    if (cur === undefined || moves < cur) {
      const next = { ...bestMoves, [diskCount]: moves };
      setBestMoves(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, [won, moves, bestMoves, diskCount]);

  function click(pegIdx: number) {
    if (won) return;
    if (selected === null) {
      if (pegs[pegIdx].length > 0) setSelected(pegIdx);
      return;
    }
    if (selected === pegIdx) {
      setSelected(null);
      return;
    }
    const from = pegs[selected];
    const to = pegs[pegIdx];
    const top = from[from.length - 1];
    const dest = to[to.length - 1];
    if (dest !== undefined && top > dest) {
      setSelected(null);
      return;
    }
    const next = pegs.map((p) => p.slice());
    next[selected].pop();
    next[pegIdx].push(top);
    setPegs(next);
    setMoves((m) => m + 1);
    setSelected(null);
  }

  const maxWidth = 100;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">Moves: {moves}</span>
        <span className="text-sky-300">Min: {minMoves}</span>
        <span className="text-neutral-400">
          Best: <span className="text-neutral-100">{bestMoves[diskCount] ?? '—'}</span>
        </span>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="text-neutral-400">Disks:</span>
        {[3, 4, 5, 6, 7].map((n) => (
          <button
            key={n}
            onClick={() => setDiskCount(n)}
            className={`rounded px-2 py-1 ${diskCount === n ? 'bg-amber-500 text-neutral-900' : 'bg-neutral-800 text-neutral-300'}`}
          >
            {n}
          </button>
        ))}
      </div>

      {won && (
        <div className="rounded bg-emerald-500/20 px-4 py-2 font-mono text-emerald-300">
          🎉 Solved in {moves} moves! (min: {minMoves})
        </div>
      )}

      <div className="flex w-full items-end justify-around gap-4 rounded-lg bg-neutral-900 p-4" style={{ height: 240 }}>
        {pegs.map((peg, i) => (
          <button
            key={i}
            onClick={() => click(i)}
            className={`relative flex h-full w-1/3 flex-col items-center justify-end rounded transition ${selected === i ? 'bg-amber-500/10 ring-2 ring-amber-400' : 'hover:bg-neutral-800/40'}`}
          >
            <div className="absolute bottom-2 h-full w-1.5 bg-neutral-700" />
            <div className="absolute bottom-1 h-1.5 w-3/4 bg-neutral-700" />
            {peg.map((size, idx) => (
              <div
                key={idx}
                className="relative z-10 mb-0.5 h-5 rounded"
                style={{
                  width: `${(size / diskCount) * maxWidth}%`,
                  background: COLORS[(size - 1) % COLORS.length],
                }}
              />
            ))}
          </button>
        ))}
      </div>

      <button onClick={() => reset(diskCount)} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>

      <p className="max-w-md text-center font-mono text-xs text-neutral-500">
        Click a peg to grab its top disk → click another peg to drop. Larger disks cannot be placed on smaller. Move all disks to the right!
      </p>
    </div>
  );
}
