'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const ROWS = 9;
const COLS = 9;
const MINES = 10;
const STORAGE_KEY = 'highScore:minesweeper';

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  count: number;
}

function build(): Cell[][] {
  const grid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      count: 0,
    }))
  );
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!grid[r][c].mine) {
      grid[r][c].mine = true;
      placed++;
    }
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].mine) continue;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr,
            nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc].mine) n++;
        }
      grid[r][c].count = n;
    }
  }
  return grid;
}

function reveal(grid: Cell[][], r: number, c: number): Cell[][] {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return grid;
  const cell = grid[r][c];
  if (cell.revealed || cell.flagged) return grid;
  const next = grid.map((row) => row.map((c) => ({ ...c })));
  const stack: [number, number][] = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    const cell = next[cr][cc];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.count === 0 && !cell.mine) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = cr + dr,
            nc = cc + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !next[nr][nc].revealed)
            stack.push([nr, nc]);
        }
    }
  }
  return next;
}

const NUM_COLOR: Record<number, string> = {
  1: 'text-blue-400',
  2: 'text-emerald-400',
  3: 'text-rose-400',
  4: 'text-purple-400',
  5: 'text-amber-500',
  6: 'text-cyan-400',
  7: 'text-pink-400',
  8: 'text-neutral-300',
};

export default function GameMinesweeper() {
  const t = useTranslations('common');
  const [grid, setGrid] = useState<Cell[][]>(() => build());
  const [over, setOver] = useState<'win' | 'lose' | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [time, setTime] = useState(0);

  const reset = useCallback(() => {
    setGrid(build());
    setOver(null);
    setStartedAt(null);
    setTime(0);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setBestTime(Number(stored));
  }, []);

  useEffect(() => {
    if (over || !startedAt) return;
    const id = setInterval(() => setTime((Date.now() - startedAt) / 1000), 100);
    return () => clearInterval(id);
  }, [startedAt, over]);

  function handleClick(r: number, c: number) {
    if (over) return;
    if (!startedAt) setStartedAt(Date.now());
    const cell = grid[r][c];
    if (cell.flagged) return;
    if (cell.mine) {
      const next = grid.map((row) => row.map((cc) => ({ ...cc, revealed: cc.mine ? true : cc.revealed })));
      setGrid(next);
      setOver('lose');
      return;
    }
    const next = reveal(grid, r, c);
    setGrid(next);
    let unrevealed = 0;
    for (const row of next) for (const cc of row) if (!cc.revealed && !cc.mine) unrevealed++;
    if (unrevealed === 0) {
      setOver('win');
      const elapsed = (Date.now() - (startedAt ?? Date.now())) / 1000;
      if (bestTime === null || elapsed < bestTime) {
        setBestTime(elapsed);
        localStorage.setItem(STORAGE_KEY, String(elapsed));
      }
    }
  }

  function handleFlag(e: React.MouseEvent, r: number, c: number) {
    e.preventDefault();
    if (over) return;
    if (grid[r][c].revealed) return;
    const next = grid.map((row) => row.map((cc) => ({ ...cc })));
    next[r][c].flagged = !next[r][c].flagged;
    setGrid(next);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">⏱ {time.toFixed(1)}s</span>
        <span className="text-neutral-400">
          Best: <span className="text-neutral-100">{bestTime ? `${bestTime.toFixed(1)}s` : '—'}</span>
        </span>
      </div>

      {over && (
        <div className={`rounded px-4 py-2 font-mono ${over === 'win' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
          {over === 'win' ? '🎉 Cleared!' : '💥 Boom!'}
        </div>
      )}

      <div className="inline-grid gap-px rounded bg-neutral-700 p-1" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => handleClick(r, c)}
              onContextMenu={(e) => handleFlag(e, r, c)}
              disabled={!!over}
              className={`flex h-7 w-7 items-center justify-center font-mono text-xs font-bold sm:h-8 sm:w-8 sm:text-sm ${
                cell.revealed
                  ? cell.mine
                    ? 'bg-rose-500/40'
                    : 'bg-neutral-900'
                  : 'bg-neutral-800 hover:bg-neutral-700'
              }`}
            >
              {cell.revealed ? (cell.mine ? '💣' : cell.count > 0 ? <span className={NUM_COLOR[cell.count]}>{cell.count}</span> : '') : cell.flagged ? '🚩' : ''}
            </button>
          ))
        )}
      </div>

      <p className="font-mono text-xs text-neutral-500">Left: reveal · Right: flag</p>

      <button onClick={reset} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>
    </div>
  );
}
