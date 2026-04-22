'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const SIZE = 8;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#a855f7', '#f97316'];
const STORAGE_KEY = 'highScore:match-three';
const STARTING_MOVES = 30;

type Grid = number[][];

function randCell() {
  return Math.floor(Math.random() * COLORS.length);
}

function findMatches(grid: Grid): Set<string> {
  const set = new Set<string>();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE - 2; c++) {
      const v = grid[r][c];
      if (v >= 0 && v === grid[r][c + 1] && v === grid[r][c + 2]) {
        set.add(`${r},${c}`); set.add(`${r},${c + 1}`); set.add(`${r},${c + 2}`);
        let k = c + 3;
        while (k < SIZE && grid[r][k] === v) { set.add(`${r},${k}`); k++; }
      }
    }
  }
  for (let c = 0; c < SIZE; c++) {
    for (let r = 0; r < SIZE - 2; r++) {
      const v = grid[r][c];
      if (v >= 0 && v === grid[r + 1][c] && v === grid[r + 2][c]) {
        set.add(`${r},${c}`); set.add(`${r + 1},${c}`); set.add(`${r + 2},${c}`);
        let k = r + 3;
        while (k < SIZE && grid[k][c] === v) { set.add(`${k},${c}`); k++; }
      }
    }
  }
  return set;
}

function buildGrid(): Grid {
  let g: Grid;
  do {
    g = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, randCell));
  } while (findMatches(g).size > 0);
  return g;
}

function applyGravity(grid: Grid): Grid {
  const next = grid.map((row) => row.slice());
  for (let c = 0; c < SIZE; c++) {
    const col: number[] = [];
    for (let r = SIZE - 1; r >= 0; r--) {
      if (next[r][c] >= 0) col.push(next[r][c]);
    }
    while (col.length < SIZE) col.push(randCell());
    for (let r = SIZE - 1; r >= 0; r--) {
      next[r][c] = col[SIZE - 1 - r];
    }
  }
  return next;
}

export default function GameMatchThree() {
  const t = useTranslations('common');
  const [grid, setGrid] = useState<Grid>(buildGrid);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(STARTING_MOVES);
  const [highScore, setHighScore] = useState(0);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => {
    setGrid(buildGrid());
    setScore(0);
    setMovesLeft(STARTING_MOVES);
    setSelected(null);
    setOver(false);
    setBusy(false);
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
  }, []);

  useEffect(() => {
    if (movesLeft <= 0 && !over) {
      setOver(true);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem(STORAGE_KEY, String(score));
      }
    }
  }, [movesLeft, over, score, highScore]);

  const resolveBoard = useCallback(async (g: Grid) => {
    setBusy(true);
    let cur = g;
    let combo = 1;
    while (true) {
      const matches = findMatches(cur);
      if (matches.size === 0) break;
      const cleared = cur.map((row, r) =>
        row.map((v, c) => (matches.has(`${r},${c}`) ? -1 : v))
      );
      setGrid(cleared);
      setScore((s) => s + matches.size * 10 * combo);
      await new Promise((r) => setTimeout(r, 250));
      cur = applyGravity(cleared);
      setGrid(cur);
      await new Promise((r) => setTimeout(r, 200));
      combo++;
    }
    setBusy(false);
  }, []);

  function tryClick(r: number, c: number) {
    if (busy || over) return;
    if (!selected) {
      setSelected({ r, c });
      return;
    }
    const dr = Math.abs(selected.r - r);
    const dc = Math.abs(selected.c - c);
    if (dr + dc !== 1) {
      setSelected({ r, c });
      return;
    }
    const next = grid.map((row) => row.slice());
    [next[selected.r][selected.c], next[r][c]] = [next[r][c], next[selected.r][selected.c]];
    if (findMatches(next).size === 0) {
      setSelected(null);
      return;
    }
    setSelected(null);
    setMovesLeft((m) => m - 1);
    setGrid(next);
    void resolveBoard(next);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">{t('score')}: {score}</span>
        <span className="text-sky-300">Moves left: {movesLeft}</span>
        <span className="text-neutral-400">{t('highScore')}: <span className="text-neutral-100">{highScore}</span></span>
      </div>

      {over && (
        <div className="rounded bg-amber-500/20 px-4 py-2 font-mono text-amber-300">
          Done! Score: {score}
        </div>
      )}

      <div className="grid gap-1 rounded bg-neutral-900 p-2" style={{ gridTemplateColumns: `repeat(${SIZE}, 36px)` }}>
        {grid.map((row, r) =>
          row.map((v, c) => {
            const isSel = selected?.r === r && selected?.c === c;
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => tryClick(r, c)}
                className={`h-9 w-9 rounded transition ${isSel ? 'ring-2 ring-white' : ''}`}
                style={{ background: v < 0 ? 'transparent' : COLORS[v] }}
              />
            );
          })
        )}
      </div>

      <button onClick={reset} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>

      <p className="max-w-md text-center font-mono text-xs text-neutral-500">
        Click two adjacent jewels to swap. 3+ same color in a row/column pops! Aim for the best score in 30 moves.
      </p>
    </div>
  );
}
