'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const SIZE = 8;
const STORAGE_KEY = 'highScore:reversi';

type Cell = 0 | 1 | 2; // 0 empty, 1 black (player), 2 white (cpu)
type Board = Cell[][];

const DIRS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

function emptyBoard(): Board {
  const b: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0) as Cell[]);
  b[3][3] = 2; b[3][4] = 1;
  b[4][3] = 1; b[4][4] = 2;
  return b;
}

function flipsFor(b: Board, r: number, c: number, who: Cell): [number, number][] {
  if (b[r][c] !== 0) return [];
  const opp = who === 1 ? 2 : 1;
  const result: [number, number][] = [];
  for (const [dr, dc] of DIRS) {
    const candidates: [number, number][] = [];
    let nr = r + dr;
    let nc = c + dc;
    while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && b[nr][nc] === opp) {
      candidates.push([nr, nc]);
      nr += dr;
      nc += dc;
    }
    if (candidates.length && nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && b[nr][nc] === who) {
      result.push(...candidates);
    }
  }
  return result;
}

function legalMoves(b: Board, who: Cell): [number, number][] {
  const moves: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (flipsFor(b, r, c, who).length > 0) moves.push([r, c]);
  return moves;
}

function applyMove(b: Board, r: number, c: number, who: Cell): Board {
  const flips = flipsFor(b, r, c, who);
  if (flips.length === 0) return b;
  const next = b.map((row) => row.slice() as Cell[]);
  next[r][c] = who;
  for (const [fr, fc] of flips) next[fr][fc] = who;
  return next;
}

function countDiscs(b: Board): { black: number; white: number } {
  let black = 0, white = 0;
  for (const row of b) for (const c of row) {
    if (c === 1) black++;
    if (c === 2) white++;
  }
  return { black, white };
}

function pickCpuMove(b: Board): [number, number] | null {
  const moves = legalMoves(b, 2);
  if (moves.length === 0) return null;
  const corners = moves.filter(([r, c]) => (r === 0 || r === SIZE - 1) && (c === 0 || c === SIZE - 1));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  let best = moves[0];
  let bestFlip = -1;
  for (const [r, c] of moves) {
    const f = flipsFor(b, r, c, 2).length;
    if (f > bestFlip) { bestFlip = f; best = [r, c]; }
  }
  return best;
}

export default function GameReversi() {
  const t = useTranslations('common');
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [turn, setTurn] = useState<Cell>(1);
  const [over, setOver] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [wins, setWins] = useState(0);

  const reset = useCallback(() => {
    setBoard(emptyBoard());
    setTurn(1);
    setOver(null);
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setWins(stored);
  }, []);

  const counts = countDiscs(board);
  const playerMoves = legalMoves(board, 1);
  const cpuMoves = legalMoves(board, 2);

  useEffect(() => {
    if (over) return;
    if (playerMoves.length === 0 && cpuMoves.length === 0) {
      const result = counts.black > counts.white ? 'win' : counts.black < counts.white ? 'lose' : 'draw';
      setOver(result);
      if (result === 'win') {
        setWins((w) => {
          const next = w + 1;
          localStorage.setItem(STORAGE_KEY, String(next));
          return next;
        });
      }
      return;
    }
    if (turn === 1 && playerMoves.length === 0) {
      setTurn(2);
      return;
    }
    if (turn === 2) {
      if (cpuMoves.length === 0) {
        setTurn(1);
        return;
      }
      const id = setTimeout(() => {
        const move = pickCpuMove(board);
        if (move) setBoard(applyMove(board, move[0], move[1], 2));
        setTurn(1);
      }, 400);
      return () => clearTimeout(id);
    }
  }, [board, turn, over, playerMoves.length, cpuMoves.length, counts.black, counts.white]);

  function play(r: number, c: number) {
    if (turn !== 1 || over) return;
    if (flipsFor(board, r, c, 1).length === 0) return;
    setBoard(applyMove(board, r, c, 1));
    setTurn(2);
  }

  const status = over === 'win' ? `🎉 Win ${counts.black}–${counts.white}` :
    over === 'lose' ? `Lose ${counts.black}–${counts.white}` :
    over === 'draw' ? `Draw ${counts.black}–${counts.white}` :
    turn === 1 ? `Your turn (●) — ${counts.black}–${counts.white}` :
    `CPU thinking... — ${counts.black}–${counts.white}`;

  const playerMoveSet = new Set(playerMoves.map(([r, c]) => `${r},${c}`));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">{status}</span>
        <span className="text-neutral-400">Wins: <span className="text-neutral-100">{wins}</span></span>
      </div>

      <div className="grid gap-px rounded bg-emerald-700 p-1" style={{ gridTemplateColumns: `repeat(${SIZE}, 36px)` }}>
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isHint = turn === 1 && !over && playerMoveSet.has(`${r},${c}`);
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => play(r, c)}
                className="flex h-9 w-9 items-center justify-center bg-emerald-800 hover:bg-emerald-700"
              >
                {cell === 1 && <div className="h-7 w-7 rounded-full bg-neutral-900 ring-1 ring-neutral-600" />}
                {cell === 2 && <div className="h-7 w-7 rounded-full bg-neutral-100 ring-1 ring-neutral-400" />}
                {cell === 0 && isHint && <div className="h-2 w-2 rounded-full bg-amber-400" />}
              </button>
            );
          })
        )}
      </div>

      <button onClick={reset} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>

      <p className="max-w-md text-center font-mono text-xs text-neutral-500">
        You are black (●), CPU is white. Click an empty cell to place a disc — every line of opponents flanked between your discs flips. Yellow dots = legal moves. Game ends when neither can move.
      </p>
    </div>
  );
}
