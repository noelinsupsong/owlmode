'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Board = number[][];
const STORAGE_KEY = 'highScore:sudoku';

function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function isValid(b: Board, r: number, c: number, n: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (b[r][i] === n || b[i][c] === n) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (b[br + i][bc + j] === n) return false;
  return true;
}

function solve(b: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (b[r][c] === 0) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (const n of nums) {
          if (isValid(b, r, c, n)) {
            b[r][c] = n;
            if (solve(b)) return true;
            b[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generate(removeCount = 40): { puzzle: Board; solution: Board } {
  const board = emptyBoard();
  solve(board);
  const solution = board.map((row) => row.slice());
  const puzzle = board.map((row) => row.slice());
  let removed = 0;
  while (removed < removeCount) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      removed++;
    }
  }
  return { puzzle, solution };
}

export default function GameSudoku() {
  const t = useTranslations('common');
  const [puzzle, setPuzzle] = useState<Board>(emptyBoard());
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [solution, setSolution] = useState<Board>(emptyBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [time, setTime] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);

  const reset = useCallback(() => {
    const { puzzle: p, solution: s } = generate(40);
    setPuzzle(p);
    setBoard(p.map((row) => row.slice()));
    setSolution(s);
    setSelected(null);
    setStartedAt(Date.now());
    setTime(0);
    setWon(false);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setBestTime(Number(stored));
    reset();
  }, [reset]);

  useEffect(() => {
    if (!startedAt || won) return;
    const id = setInterval(() => setTime((Date.now() - startedAt) / 1000), 200);
    return () => clearInterval(id);
  }, [startedAt, won]);

  function setCell(n: number) {
    if (!selected) return;
    const [r, c] = selected;
    if (puzzle[r][c] !== 0) return;
    const next = board.map((row) => row.slice());
    next[r][c] = n;
    setBoard(next);
    if (next.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]))) {
      setWon(true);
      const elapsed = (Date.now() - (startedAt ?? Date.now())) / 1000;
      if (bestTime === null || elapsed < bestTime) {
        setBestTime(elapsed);
        localStorage.setItem(STORAGE_KEY, String(elapsed));
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">⏱ {time.toFixed(1)}s</span>
        <span className="text-neutral-400">
          Best: <span className="text-neutral-100">{bestTime ? `${bestTime.toFixed(1)}s` : '—'}</span>
        </span>
      </div>

      {won && (
        <div className="rounded bg-emerald-500/20 px-4 py-2 font-mono text-emerald-300">
          🎉 Solved in {time.toFixed(1)}s!
        </div>
      )}

      <div className="grid grid-cols-9 gap-px bg-neutral-700 p-px">
        {board.map((row, r) =>
          row.map((v, c) => {
            const fixed = puzzle[r][c] !== 0;
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isWrong = v !== 0 && v !== solution[r][c];
            const borderClasses = `${r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-neutral-500' : ''} ${c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-neutral-500' : ''}`;
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => !fixed && setSelected([r, c])}
                className={`flex h-8 w-8 items-center justify-center font-mono text-sm sm:h-10 sm:w-10 sm:text-base ${
                  isSelected ? 'bg-amber-500/30' : fixed ? 'bg-neutral-800' : 'bg-neutral-900'
                } ${fixed ? 'text-neutral-300' : isWrong ? 'text-rose-400' : 'text-amber-300'} ${borderClasses}`}
              >
                {v || ''}
              </button>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-9 gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => setCell(n)}
            className="h-8 w-8 rounded bg-neutral-800 font-mono text-sm font-bold text-neutral-100 hover:bg-neutral-700"
          >
            {n}
          </button>
        ))}
      </div>

      <button onClick={() => setCell(0)} className="rounded bg-neutral-800 px-4 py-1 font-mono text-xs text-neutral-300 hover:bg-neutral-700">
        Erase
      </button>

      <button onClick={reset} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>
    </div>
  );
}
