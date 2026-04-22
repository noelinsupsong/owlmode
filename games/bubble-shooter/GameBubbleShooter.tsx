'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const W = 360;
const H = 480;
const RADIUS = 18;
const COLS = 10;
const TOP_ROWS = 6;
const STORAGE_KEY = 'highScore:bubble-shooter';

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#a855f7'];

interface Bubble {
  row: number;
  col: number;
  color: number;
}

function bubblePos(row: number, col: number): { x: number; y: number } {
  const offset = row % 2 === 0 ? 0 : RADIUS;
  return { x: RADIUS + col * RADIUS * 2 + offset, y: RADIUS + row * RADIUS * 1.7 };
}

function buildGrid(): Bubble[] {
  const g: Bubble[] = [];
  for (let r = 0; r < TOP_ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      g.push({ row: r, col: c, color: Math.floor(Math.random() * COLORS.length) });
    }
  }
  return g;
}

function neighbors(b: Bubble, grid: Bubble[]): Bubble[] {
  const dRowEven = [
    [-1, -1],
    [-1, 0],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
  ];
  const dRowOdd = [
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, 0],
    [1, 1],
  ];
  const dirs = b.row % 2 === 0 ? dRowEven : dRowOdd;
  const result: Bubble[] = [];
  for (const [dr, dc] of dirs) {
    const found = grid.find((x) => x.row === b.row + dr && x.col === b.col + dc);
    if (found) result.push(found);
  }
  return result;
}

function findCluster(start: Bubble, grid: Bubble[]): Bubble[] {
  const visited = new Set<Bubble>();
  const stack = [start];
  while (stack.length) {
    const b = stack.pop()!;
    if (visited.has(b)) continue;
    visited.add(b);
    for (const n of neighbors(b, grid)) {
      if (n.color === start.color && !visited.has(n)) stack.push(n);
    }
  }
  return Array.from(visited);
}

export default function GameBubbleShooter() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Bubble[]>(buildGrid());
  const shooterColorRef = useRef(0);
  const angleRef = useRef(-Math.PI / 2);
  const flyingRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    for (const b of gridRef.current) {
      const { x, y } = bubblePos(b.row, b.col);
      ctx.fillStyle = COLORS[b.color];
      ctx.beginPath();
      ctx.arc(x, y, RADIUS - 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (flyingRef.current) {
      ctx.fillStyle = COLORS[shooterColorRef.current];
      ctx.beginPath();
      ctx.arc(flyingRef.current.x, flyingRef.current.y, RADIUS - 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = COLORS[shooterColorRef.current];
      ctx.beginPath();
      ctx.arc(W / 2, H - 30, RADIUS - 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#737373';
    ctx.beginPath();
    ctx.moveTo(W / 2, H - 30);
    ctx.lineTo(W / 2 + Math.cos(angleRef.current) * 40, H - 30 + Math.sin(angleRef.current) * 40);
    ctx.stroke();
  }, []);

  const settleBubble = useCallback((bx: number, by: number) => {
    let bestRow = 0;
    let bestCol = 0;
    let bestDist = Infinity;
    for (let r = 0; r < TOP_ROWS + 6; r++) {
      for (let c = 0; c < COLS; c++) {
        const { x, y } = bubblePos(r, c);
        const d = (x - bx) ** 2 + (y - by) ** 2;
        if (d < bestDist && !gridRef.current.some((b) => b.row === r && b.col === c)) {
          bestDist = d;
          bestRow = r;
          bestCol = c;
        }
      }
    }
    const newBubble: Bubble = { row: bestRow, col: bestCol, color: shooterColorRef.current };
    gridRef.current.push(newBubble);
    const cluster = findCluster(newBubble, gridRef.current);
    if (cluster.length >= 3) {
      gridRef.current = gridRef.current.filter((b) => !cluster.includes(b));
      setScore((s) => s + cluster.length * 10);
    }
    if (gridRef.current.some((b) => bubblePos(b.row, b.col).y > H - 80)) {
      setOver(true);
    }
    if (gridRef.current.length === 0) {
      gridRef.current = buildGrid();
    }
    shooterColorRef.current = Math.floor(Math.random() * COLORS.length);
    flyingRef.current = null;
  }, []);

  const tick = useCallback(() => {
    const f = flyingRef.current;
    if (f) {
      f.x += f.vx;
      f.y += f.vy;
      if (f.x < RADIUS || f.x > W - RADIUS) f.vx = -f.vx;
      if (f.y < RADIUS) {
        settleBubble(f.x, f.y);
      } else {
        for (const b of gridRef.current) {
          const p = bubblePos(b.row, b.col);
          if ((p.x - f.x) ** 2 + (p.y - f.y) ** 2 < (RADIUS * 2) ** 2) {
            settleBubble(f.x, f.y);
            break;
          }
        }
      }
    }
    draw();
    if (!over) rafRef.current = requestAnimationFrame(tick);
  }, [draw, settleBubble, over]);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  useEffect(() => {
    if (over && score > highScore) {
      setHighScore(score);
      localStorage.setItem(STORAGE_KEY, String(score));
    }
  }, [over, score, highScore]);

  function onMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const my = ((e.clientY - rect.top) / rect.height) * H;
    angleRef.current = Math.atan2(my - (H - 30), mx - W / 2);
    if (angleRef.current > -0.1) angleRef.current = -0.1;
    if (angleRef.current < -Math.PI + 0.1) angleRef.current = -Math.PI + 0.1;
  }

  function shoot() {
    if (flyingRef.current || over) return;
    flyingRef.current = {
      x: W / 2,
      y: H - 30,
      vx: Math.cos(angleRef.current) * 8,
      vy: Math.sin(angleRef.current) * 8,
    };
  }

  function reset() {
    gridRef.current = buildGrid();
    flyingRef.current = null;
    shooterColorRef.current = Math.floor(Math.random() * COLORS.length);
    setScore(0);
    setOver(false);
    rafRef.current = requestAnimationFrame(tick);
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

      <canvas ref={canvasRef} width={W} height={H} onMouseMove={onMove} onClick={shoot} className="rounded border border-neutral-800 cursor-crosshair" />

      <button onClick={reset} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>

      <p className="font-mono text-xs text-neutral-500">Mouse: aim & click to shoot</p>
    </div>
  );
}
