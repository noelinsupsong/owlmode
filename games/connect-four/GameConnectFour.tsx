'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const ROWS = 6;
const COLS = 7;
const STORAGE_KEY = 'highScore:connect-four';

type Cell = 0 | 1 | 2;
type Board = Cell[][];

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as Cell[]);
}

function drop(board: Board, col: number, who: Cell): Board | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      const next = board.map((row) => row.slice() as Cell[]);
      next[r][col] = who;
      return next;
    }
  }
  return null;
}

function checkWin(board: Board, who: Cell): boolean {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== who) continue;
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
        let count = 1;
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
          if (board[nr][nc] !== who) break;
          count++;
        }
        if (count >= 4) return true;
      }
    }
  return false;
}

function isFull(board: Board): boolean {
  return board[0].every((c) => c !== 0);
}

function cpuMove(board: Board): number {
  for (let c = 0; c < COLS; c++) {
    const test = drop(board, c, 2);
    if (test && checkWin(test, 2)) return c;
  }
  for (let c = 0; c < COLS; c++) {
    const test = drop(board, c, 1);
    if (test && checkWin(test, 1)) return c;
  }
  const choices = [3, 2, 4, 1, 5, 0, 6].filter((c) => board[0][c] === 0);
  return choices[0] ?? 0;
}

export default function GameConnectFour() {
  const t = useTranslations('common');
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [turn, setTurn] = useState<Cell>(1);
  const [winner, setWinner] = useState<0 | 1 | 2 | 'draw' | null>(null);
  const [wins, setWins] = useState(0);

  const reset = useCallback(() => {
    setBoard(emptyBoard());
    setTurn(1);
    setWinner(null);
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setWins(stored);
  }, []);

  useEffect(() => {
    if (winner !== null || turn !== 2) return;
    const id = setTimeout(() => {
      const c = cpuMove(board);
      const next = drop(board, c, 2);
      if (!next) return;
      setBoard(next);
      if (checkWin(next, 2)) {
        setWinner(2);
      } else if (isFull(next)) {
        setWinner('draw');
      } else {
        setTurn(1);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [turn, board, winner]);

  function play(col: number) {
    if (winner !== null || turn !== 1) return;
    const next = drop(board, col, 1);
    if (!next) return;
    setBoard(next);
    if (checkWin(next, 1)) {
      setWinner(1);
      setWins((w) => {
        const n = w + 1;
        localStorage.setItem(STORAGE_KEY, String(n));
        return n;
      });
    } else if (isFull(next)) setWinner('draw');
    else setTurn(2);
  }

  const status =
    winner === 1
      ? '🎉 You win!'
      : winner === 2
        ? 'Computer wins'
        : winner === 'draw'
          ? 'Draw'
          : turn === 1
            ? 'Your turn (🔴)'
            : 'CPU thinking...';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">{status}</span>
        <span className="text-neutral-400">Wins: <span className="text-neutral-100">{wins}</span></span>
      </div>

      <div className="rounded-lg bg-blue-900 p-2">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
          {Array.from({ length: COLS }).map((_, c) => (
            <button
              key={`btn-${c}`}
              onClick={() => play(c)}
              disabled={winner !== null || turn !== 1 || board[0][c] !== 0}
              className="flex h-6 items-center justify-center rounded text-xs text-blue-200 hover:bg-blue-800 disabled:opacity-30"
            >
              ▼
            </button>
          ))}
          {board.flatMap((row, r) =>
            row.map((cell, c) => (
              <div key={`${r}-${c}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-950 sm:h-10 sm:w-10">
                <div
                  className={`h-7 w-7 rounded-full sm:h-8 sm:w-8 ${
                    cell === 1 ? 'bg-rose-500' : cell === 2 ? 'bg-amber-400' : 'bg-neutral-800'
                  }`}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <button onClick={reset} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>
    </div>
  );
}
