'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const SIZE = 4;
const STORAGE_KEY = 'highScore:fifteen-puzzle';

function isSolvable(arr: number[]): boolean {
  let inv = 0;
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++)
      if (arr[i] && arr[j] && arr[i] > arr[j]) inv++;
  const blankRow = SIZE - Math.floor(arr.indexOf(0) / SIZE);
  return SIZE % 2 === 1 ? inv % 2 === 0 : (inv + blankRow) % 2 === 0;
}

function shuffle(): number[] {
  while (true) {
    const arr = Array.from({ length: SIZE * SIZE }, (_, i) => i).sort(() => Math.random() - 0.5);
    if (isSolvable(arr) && !isSolved(arr)) return arr;
  }
}

function isSolved(arr: number[]): boolean {
  for (let i = 0; i < arr.length - 1; i++) if (arr[i] !== i + 1) return false;
  return arr[arr.length - 1] === 0;
}

export default function GameFifteenPuzzle() {
  const t = useTranslations('common');
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const won = tiles.length > 0 && isSolved(tiles);

  const reset = useCallback(() => {
    setTiles(shuffle());
    setMoves(0);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setBestMoves(Number(stored));
    reset();
  }, [reset]);

  useEffect(() => {
    if (won) {
      if (bestMoves === null || moves < bestMoves) {
        setBestMoves(moves);
        localStorage.setItem(STORAGE_KEY, String(moves));
      }
    }
  }, [won, moves, bestMoves]);

  function tryMove(idx: number) {
    if (won) return;
    const blank = tiles.indexOf(0);
    const r1 = Math.floor(idx / SIZE);
    const c1 = idx % SIZE;
    const r2 = Math.floor(blank / SIZE);
    const c2 = blank % SIZE;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;
    const next = tiles.slice();
    [next[idx], next[blank]] = [next[blank], next[idx]];
    setTiles(next);
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
          🎉 Solved in {moves} moves!
        </div>
      )}

      <div className="flex items-start gap-6">
        <div className="grid grid-cols-4 gap-2 rounded-lg bg-neutral-900 p-2">
          {tiles.map((v, i) => (
            <button
              key={i}
              onClick={() => tryMove(i)}
              className={`flex h-16 w-16 items-center justify-center rounded font-mono text-xl font-bold sm:h-20 sm:w-20 ${
                v === 0 ? 'bg-neutral-800' : 'bg-amber-500 text-neutral-900 hover:bg-amber-400'
              }`}
              disabled={v === 0}
            >
              {v || ''}
            </button>
          ))}
        </div>

        <div className="hidden flex-col items-center gap-1 sm:flex">
          <div className="font-mono text-xs uppercase tracking-wider text-neutral-500">
            Goal
          </div>
          <div className="grid grid-cols-4 gap-1 rounded bg-neutral-900 p-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0].map((v) => (
              <div
                key={v}
                className={`flex h-6 w-6 items-center justify-center rounded font-mono text-[10px] font-bold ${
                  v === 0 ? 'bg-neutral-800' : 'bg-emerald-500/30 text-emerald-200'
                }`}
              >
                {v || ''}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="max-w-md text-center font-mono text-xs text-neutral-500">
        Click any tile adjacent to the empty cell to slide it in. Arrange 1→15 with the last cell empty to win!
      </p>

      <button onClick={reset} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>
    </div>
  );
}
