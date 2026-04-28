'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import TouchControls from '@/components/TouchControls';

type Grid = number[][];
const SIZE = 4;
const STORAGE_KEY = 'highScore:2048';

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandomTile(grid: Grid): Grid {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (!empty.length) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = grid.map((row) => row.slice());
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function slide(row: number[]): { row: number[]; gained: number } {
  const filtered = row.filter((v) => v !== 0);
  let gained = 0;
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      gained += filtered[i];
      filtered.splice(i + 1, 1);
    }
  }
  while (filtered.length < SIZE) filtered.push(0);
  return { row: filtered, gained };
}

function rotate(grid: Grid): Grid {
  const next = emptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      next[c][SIZE - 1 - r] = grid[r][c];
    }
  }
  return next;
}

type Dir = 'left' | 'right' | 'up' | 'down';

function move(grid: Grid, dir: Dir): { grid: Grid; gained: number; moved: boolean } {
  let g = grid;
  const rotations: Record<Dir, number> = { left: 0, up: 1, right: 2, down: 3 };
  const k = rotations[dir];
  for (let i = 0; i < k; i++) g = rotate(g);

  let gained = 0;
  let moved = false;
  const next = g.map((row) => {
    const { row: r, gained: gain } = slide(row);
    gained += gain;
    if (r.some((v, i) => v !== row[i])) moved = true;
    return r;
  });

  let result = next;
  for (let i = 0; i < (4 - k) % 4; i++) result = rotate(result);
  return { grid: result, gained, moved };
}

function isGameOver(grid: Grid): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (grid[r][c] === 0) return false;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE - 1; c++)
      if (grid[r][c] === grid[r][c + 1]) return false;
  for (let r = 0; r < SIZE - 1; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === grid[r + 1][c]) return false;
  return true;
}

const TILE_COLORS: Record<number, string> = {
  0: 'bg-neutral-800 text-transparent',
  2: 'bg-neutral-700 text-neutral-100',
  4: 'bg-neutral-600 text-neutral-100',
  8: 'bg-amber-700 text-amber-50',
  16: 'bg-amber-600 text-amber-50',
  32: 'bg-amber-500 text-neutral-900',
  64: 'bg-orange-500 text-orange-50',
  128: 'bg-orange-600 text-orange-50',
  256: 'bg-rose-500 text-rose-50',
  512: 'bg-rose-600 text-rose-50',
  1024: 'bg-fuchsia-600 text-fuchsia-50',
  2048: 'bg-emerald-500 text-emerald-50',
};

export default function Game2048() {
  const t = useTranslations('common');
  const [grid, setGrid] = useState<Grid>(emptyGrid());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const reset = useCallback(() => {
    let g = emptyGrid();
    g = addRandomTile(g);
    g = addRandomTile(g);
    setGrid(g);
    setScore(0);
    setGameOver(false);
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
    reset();
  }, [reset]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem(STORAGE_KEY, String(score));
    }
  }, [score, highScore]);

  const handleMove = useCallback(
    (dir: Dir) => {
      if (gameOver) return;
      const { grid: next, gained, moved } = move(grid, dir);
      if (!moved) return;
      const after = addRandomTile(next);
      setGrid(after);
      setScore((s) => s + gained);
      if (isGameOver(after)) setGameOver(true);
    },
    [grid, gameOver]
  );

  useEffect(() => {
    const map: Record<string, Dir> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      a: 'left',
      d: 'right',
      w: 'up',
      s: 'down',
    };
    function onKey(e: KeyboardEvent) {
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleMove]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">
          {t('score')}: {score}
        </span>
        <span className="text-neutral-400">
          {t('highScore')}: <span className="text-neutral-100">{highScore}</span>
        </span>
      </div>

      {gameOver && (
        <div className="rounded bg-rose-500/20 px-4 py-2 font-mono text-rose-300">
          Game Over
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 rounded-lg bg-neutral-900 p-2">
        {grid.flat().map((v, i) => (
          <div
            key={i}
            className={`flex h-16 w-16 items-center justify-center rounded font-mono text-xl font-bold transition sm:h-20 sm:w-20 sm:text-2xl ${TILE_COLORS[v] ?? 'bg-emerald-700 text-emerald-50'}`}
          >
            {v || ''}
          </div>
        ))}
      </div>

      <button
        onClick={reset}
        className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400"
      >
        {t('restart')}
      </button>

      <TouchControls preset="dpad" />
    </div>
  );
}
