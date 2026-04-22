'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const COLS = 13;
const ROWS = 13;
const CELL = 32;
const W = COLS * CELL;
const H = ROWS * CELL;
const STORAGE_KEY = 'highScore:frogger';

type LaneType = 'goal' | 'grass' | 'log' | 'mid' | 'car' | 'start';
interface Lane {
  type: LaneType;
  speed: number;
  spacing: number;
  size: number;
  color: string;
}

const LANES: Lane[] = [
  { type: 'goal', speed: 0, spacing: 0, size: 0, color: '#facc15' },
  { type: 'grass', speed: 0, spacing: 0, size: 0, color: '#16a34a' },
  { type: 'log', speed: 1.4, spacing: 5, size: 3, color: '#92400e' },
  { type: 'log', speed: -1.0, spacing: 6, size: 2, color: '#92400e' },
  { type: 'log', speed: 1.7, spacing: 5, size: 3, color: '#92400e' },
  { type: 'log', speed: -1.3, spacing: 5, size: 2, color: '#92400e' },
  { type: 'mid', speed: 0, spacing: 0, size: 0, color: '#15803d' },
  { type: 'car', speed: -1.6, spacing: 4, size: 1, color: '#ef4444' },
  { type: 'car', speed: 1.2, spacing: 4, size: 1, color: '#3b82f6' },
  { type: 'car', speed: -2.0, spacing: 5, size: 2, color: '#a855f7' },
  { type: 'car', speed: 1.8, spacing: 4, size: 1, color: '#f97316' },
  { type: 'start', speed: 0, spacing: 0, size: 0, color: '#16a34a' },
  { type: 'start', speed: 0, spacing: 0, size: 0, color: '#16a34a' },
];

interface Mover {
  laneIdx: number;
  x: number;
  size: number;
}

function buildMovers(): Mover[] {
  const movers: Mover[] = [];
  LANES.forEach((lane, i) => {
    if (lane.spacing === 0) return;
    const step = (lane.size + lane.spacing) * CELL;
    let x = -CELL * 2;
    while (x < W + CELL * 2) {
      movers.push({ laneIdx: i, x, size: lane.size });
      x += step;
    }
  });
  return movers;
}

export default function GameFrogger() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frogRef = useRef({ col: 6, row: 12 });
  const moversRef = useRef<Mover[]>(buildMovers());
  const carryRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    LANES.forEach((lane, i) => {
      let bg = '#0a0a0a';
      if (lane.type === 'log') bg = '#1e3a8a';
      else if (lane.type === 'car') bg = '#171717';
      else if (lane.type === 'goal') bg = '#fde68a';
      else bg = '#14532d';
      ctx.fillStyle = bg;
      ctx.fillRect(0, i * CELL, W, CELL);
    });

    for (let c = 0; c < COLS; c++) {
      if (c % 2 === 0) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(c * CELL, 0, CELL, CELL);
      }
    }

    for (const m of moversRef.current) {
      const lane = LANES[m.laneIdx];
      ctx.fillStyle = lane.color;
      ctx.fillRect(m.x + 2, m.laneIdx * CELL + 4, m.size * CELL - 4, CELL - 8);
    }

    const f = frogRef.current;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(f.col * CELL + 4, f.row * CELL + 4, CELL - 8, CELL - 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(f.col * CELL + 8, f.row * CELL + 8, 3, 3);
    ctx.fillRect(f.col * CELL + CELL - 11, f.row * CELL + 8, 3, 3);
  }, []);

  const tick = useCallback(() => {
    for (const m of moversRef.current) {
      const lane = LANES[m.laneIdx];
      m.x += lane.speed;
      if (lane.speed > 0 && m.x > W + CELL) m.x = -m.size * CELL;
      if (lane.speed < 0 && m.x + m.size * CELL < 0) m.x = W;
    }

    const f = frogRef.current;
    const lane = LANES[f.row];
    if (lane.type === 'log') {
      const onLog = moversRef.current.find(
        (m) => m.laneIdx === f.row && f.col * CELL + CELL / 2 >= m.x && f.col * CELL + CELL / 2 <= m.x + m.size * CELL
      );
      if (onLog) {
        carryRef.current = lane.speed;
      } else {
        loseLife();
        return;
      }
    } else if (lane.type === 'car') {
      const hit = moversRef.current.find(
        (m) => m.laneIdx === f.row && f.col * CELL + CELL / 2 >= m.x && f.col * CELL + CELL / 2 <= m.x + m.size * CELL
      );
      if (hit) {
        loseLife();
        return;
      }
      carryRef.current = 0;
    } else {
      carryRef.current = 0;
    }

    if (carryRef.current !== 0) {
      const dx = carryRef.current / CELL;
      f.col = Math.max(0, Math.min(COLS - 1, f.col + dx));
    }

    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  const loseLife = useCallback(() => {
    setLives((l) => {
      const next = l - 1;
      if (next <= 0) {
        setOver(true);
        setRunning(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setHighScore((h) => {
          if (score > h) {
            localStorage.setItem(STORAGE_KEY, String(score));
            return score;
          }
          return h;
        });
      } else {
        frogRef.current = { col: 6, row: 12 };
      }
      return Math.max(0, next);
    });
  }, [score]);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
    draw();
  }, [draw]);

  useEffect(() => {
    if (!running) return;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, tick]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!running) return;
      const f = frogRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w') {
        f.row = Math.max(0, f.row - 1);
        if (f.row === 0) {
          setScore((s) => s + 100);
          frogRef.current = { col: 6, row: 12 };
        }
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        f.row = Math.min(ROWS - 1, f.row + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        f.col = Math.max(0, f.col - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        f.col = Math.min(COLS - 1, f.col + 1);
      } else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running]);

  function start() {
    frogRef.current = { col: 6, row: 12 };
    moversRef.current = buildMovers();
    carryRef.current = 0;
    setScore(0);
    setLives(3);
    setOver(false);
    setRunning(true);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">{t('score')}: {score}</span>
        <span className="text-rose-300">♥ {lives}</span>
        <span className="text-neutral-400">
          {t('highScore')}: <span className="text-neutral-100">{highScore}</span>
        </span>
      </div>

      {over && (
        <div className="rounded bg-rose-500/20 px-4 py-2 font-mono text-rose-300">Game Over · {score}</div>
      )}

      <canvas ref={canvasRef} width={W} height={H} className="rounded border border-neutral-800" />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}

      <p className="font-mono text-xs text-neutral-500">↑↓←→ or WASD</p>
    </div>
  );
}
