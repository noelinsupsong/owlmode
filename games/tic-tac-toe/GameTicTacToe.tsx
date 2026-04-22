'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

type Cell = 'X' | 'O' | null;
type Board = Cell[];

const LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calcWinner(board: Board): { winner: Cell; line: readonly number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

function pickComputerMove(board: Board): number {
  const empty = board
    .map((c, i) => (c === null ? i : -1))
    .filter((i) => i >= 0);

  for (const i of empty) {
    const test = board.slice();
    test[i] = 'O';
    if (calcWinner(test)?.winner === 'O') return i;
  }
  for (const i of empty) {
    const test = board.slice();
    test[i] = 'X';
    if (calcWinner(test)?.winner === 'X') return i;
  }
  if (board[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

const STORAGE_KEY = 'highScore:tic-tac-toe';

export default function GameTicTacToe() {
  const t = useTranslations('common');
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [wins, setWins] = useState(0);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setWins(stored);
  }, []);

  const result = useMemo(() => calcWinner(board), [board]);
  const isDraw = !result && board.every((c) => c !== null);

  useEffect(() => {
    if (result?.winner === 'X') {
      setWins((w) => {
        const next = w + 1;
        localStorage.setItem(STORAGE_KEY, String(next));
        return next;
      });
    }
  }, [result]);

  useEffect(() => {
    if (xIsNext || result || isDraw) return;
    const id = setTimeout(() => {
      const move = pickComputerMove(board);
      const next = board.slice();
      next[move] = 'O';
      setBoard(next);
      setXIsNext(true);
    }, 400);
    return () => clearTimeout(id);
  }, [xIsNext, board, result, isDraw]);

  function handleClick(i: number) {
    if (board[i] || result || !xIsNext) return;
    const next = board.slice();
    next[i] = 'X';
    setBoard(next);
    setXIsNext(false);
  }

  function handleRestart() {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  }

  const status = result
    ? result.winner === 'X'
      ? 'You win! 🎉'
      : 'Computer wins'
    : isDraw
      ? 'Draw'
      : xIsNext
        ? 'Your turn (X)'
        : 'Computer thinking...';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between gap-4 font-mono text-sm">
        <span className="text-amber-300">{status}</span>
        <span className="text-neutral-400">
          {t('highScore')}: <span className="text-neutral-100">{wins}</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => {
          const isWinningCell = result?.line.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={!!cell || !!result || !xIsNext}
              className={`flex h-20 w-20 items-center justify-center rounded font-mono text-3xl font-bold transition sm:h-24 sm:w-24 ${
                isWinningCell
                  ? 'bg-amber-500/30 text-amber-300'
                  : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
              } disabled:cursor-not-allowed disabled:opacity-70`}
              aria-label={`Cell ${i + 1}`}
            >
              {cell ?? ''}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleRestart}
        className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400"
      >
        {t('restart')}
      </button>
    </div>
  );
}
