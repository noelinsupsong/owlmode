'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const SIZE = 5;
const STORAGE_KEY = 'highScore:lights-out';

function emptyGrid(): boolean[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
}

function shuffleGrid(): boolean[][] {
  const g = emptyGrid();
  const moves = 8 + Math.floor(Math.random() * 6);
  for (let i = 0; i < moves; i++) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    toggleAt(g, r, c);
  }
  return g;
}

function toggleAt(g: boolean[][], r: number, c: number) {
  const cells = [[r, c], [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
  for (const [nr, nc] of cells) {
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) g[nr][nc] = !g[nr][nc];
  }
}

export default function GameLightsOut() {
  const t = useTranslations('common');
  const [grid, setGrid] = useState<boolean[][]>(emptyGrid);
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState<number | null>(null);

  const won = grid.every((row) => row.every((on) => !on));

  const reset = useCallback(() => {
    setGrid(shuffleGrid());
    setMoves(0);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setBestMoves(Number(stored));
    setGrid(shuffleGrid());
  }, []);

  useEffect(() => {
    if (!won || moves === 0) return;
    if (bestMoves === null || moves < bestMoves) {
      setBestMoves(moves);
      localStorage.setItem(STORAGE_KEY, String(moves));
    }
  }, [won, moves, bestMoves]);

  function click(r: number, c: number) {
    if (won) return;
    const next = grid.map((row) => row.slice());
    toggleAt(next, r, c);
    setGrid(next);
    setMoves((m) => m + 1);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">Moves: {moves}</span>
        <span className="text-neutral-400">
          Best: <span className="text-neutral-100">{bestMoves ?? '—'}</span>
        </span>
      </div>

      {won && (
        <div className="rounded bg-emerald-500/20 px-4 py-2 font-mono text-emerald-300">
          🎉 All lights out in {moves} moves!
        </div>
      )}

      <div className="grid grid-cols-5 gap-2 rounded-lg bg-neutral-900 p-3">
        {grid.map((row, r) =>
          row.map((on, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => click(r, c)}
              className={`h-14 w-14 rounded transition sm:h-16 sm:w-16 ${on ? 'bg-amber-400 shadow-lg shadow-amber-400/40' : 'bg-neutral-800'}`}
              aria-label={`Cell ${r},${c}`}
            />
          ))
        )}
      </div>

      <button onClick={reset} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>

      <p className="max-w-md text-center font-mono text-xs text-neutral-500">
        Click a cell to toggle it and its 4 adjacent cells. Turn every cell off (gray) to win!
      </p>
    </div>
  );
}
