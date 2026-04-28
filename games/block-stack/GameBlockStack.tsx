'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import TouchControls from '@/components/TouchControls';

const COLS = 10;
const ROWS = 20;
const CELL = 22;
const STORAGE_KEY = 'highScore:block-stack';

type Cell = number;

const SHAPES: number[][][][] = [
  [[[1, 1, 1, 1]]],
  [
    [
      [1, 1],
      [1, 1],
    ],
  ],
  [
    [
      [0, 1, 0],
      [1, 1, 1],
    ],
  ],
  [
    [
      [0, 1, 1],
      [1, 1, 0],
    ],
  ],
  [
    [
      [1, 1, 0],
      [0, 1, 1],
    ],
  ],
  [
    [
      [1, 0, 0],
      [1, 1, 1],
    ],
  ],
  [
    [
      [0, 0, 1],
      [1, 1, 1],
    ],
  ],
];

const COLORS = ['#06b6d4', '#facc15', '#a855f7', '#22c55e', '#ef4444', '#3b82f6', '#f97316'];

interface Piece {
  shape: number[][];
  type: number;
  x: number;
  y: number;
}

function newPiece(): Piece {
  const type = Math.floor(Math.random() * SHAPES.length);
  const shape = SHAPES[type][0].map((row) => row.slice());
  return { shape, type: type + 1, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function rotate(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const out = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = shape[r][c];
  return out;
}

function emptyGrid(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function collides(grid: Cell[][], piece: Piece, dx = 0, dy = 0, shape?: number[][]): boolean {
  const s = shape ?? piece.shape;
  for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < s[r].length; c++) {
      if (!s[r][c]) continue;
      const nr = piece.y + r + dy;
      const nc = piece.x + c + dx;
      if (nc < 0 || nc >= COLS || nr >= ROWS) return true;
      if (nr >= 0 && grid[nr][nc]) return true;
    }
  }
  return false;
}

function merge(grid: Cell[][], piece: Piece): Cell[][] {
  const next = grid.map((row) => row.slice());
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const nr = piece.y + r;
        const nc = piece.x + c;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) next[nr][nc] = piece.type;
      }
    }
  }
  return next;
}

function clearLines(grid: Cell[][]): { grid: Cell[][]; cleared: number } {
  const remaining = grid.filter((row) => row.some((v) => v === 0));
  const cleared = ROWS - remaining.length;
  while (remaining.length < ROWS) remaining.unshift(Array(COLS).fill(0));
  return { grid: remaining, cleared };
}

export default function GameBlockStack() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Cell[][]>(emptyGrid());
  const pieceRef = useRef<Piece>(newPiece());
  const dropRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function drawCell(r: number, c: number, type: number) {
      ctx!.fillStyle = COLORS[(type - 1) % COLORS.length];
      ctx!.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
    }

    const g = gridRef.current;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (g[r][c]) drawCell(r, c, g[r][c]);

    const p = pieceRef.current;
    for (let r = 0; r < p.shape.length; r++)
      for (let c = 0; c < p.shape[r].length; c++)
        if (p.shape[r][c]) drawCell(p.y + r, p.x + c, p.type);
  }, []);

  const tick = useCallback(() => {
    const p = pieceRef.current;
    if (!collides(gridRef.current, p, 0, 1)) {
      pieceRef.current = { ...p, y: p.y + 1 };
    } else {
      gridRef.current = merge(gridRef.current, p);
      const { grid: ng, cleared } = clearLines(gridRef.current);
      gridRef.current = ng;
      if (cleared) setScore((s) => s + cleared * 100);
      const np = newPiece();
      if (collides(ng, np)) {
        setOver(true);
        setRunning(false);
        if (dropRef.current) clearInterval(dropRef.current);
        return;
      }
      pieceRef.current = np;
    }
    draw();
  }, [draw]);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
    draw();
  }, [draw]);

  useEffect(() => {
    if (!running) return;
    dropRef.current = setInterval(tick, 600);
    return () => {
      if (dropRef.current) clearInterval(dropRef.current);
    };
  }, [running, tick]);

  useEffect(() => {
    if (!running) return;
    function onKey(e: KeyboardEvent) {
      const p = pieceRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (!collides(gridRef.current, p, -1, 0)) pieceRef.current = { ...p, x: p.x - 1 };
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        if (!collides(gridRef.current, p, 1, 0)) pieceRef.current = { ...p, x: p.x + 1 };
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        if (!collides(gridRef.current, p, 0, 1)) pieceRef.current = { ...p, y: p.y + 1 };
      } else if (e.key === 'ArrowUp' || e.key === 'w') {
        const r = rotate(p.shape);
        if (!collides(gridRef.current, p, 0, 0, r)) pieceRef.current = { ...p, shape: r };
      } else if (e.key === ' ') {
        let dy = 0;
        while (!collides(gridRef.current, p, 0, dy + 1)) dy++;
        pieceRef.current = { ...p, y: p.y + dy };
        tick();
      } else return;
      e.preventDefault();
      draw();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, draw, tick]);

  useEffect(() => {
    if (over && score > highScore) {
      setHighScore(score);
      localStorage.setItem(STORAGE_KEY, String(score));
    }
  }, [over, score, highScore]);

  function start() {
    gridRef.current = emptyGrid();
    pieceRef.current = newPiece();
    setScore(0);
    setOver(false);
    setRunning(true);
    draw();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">{t('score')}: {score}</span>
        <span className="text-neutral-400">
          {t('highScore')}: <span className="text-neutral-100">{highScore}</span>
        </span>
      </div>

      {over && (
        <div className="rounded bg-rose-500/20 px-4 py-2 font-mono text-rose-300">Game Over</div>
      )}

      <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} data-running={running} className="rounded border border-neutral-800" />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}

      <p className="font-mono text-xs text-neutral-500">←→: move · ↑: rotate · ↓: soft drop · Space: hard drop</p>

      <TouchControls preset="block-stack" />
    </div>
  );
}
