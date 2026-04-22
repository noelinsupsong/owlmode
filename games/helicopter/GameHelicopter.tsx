'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const W = 600;
const H = 320;
const HELI_X = 80;
const HELI_W = 36;
const HELI_H = 18;
const SLICE_W = 4;
const STORAGE_KEY = 'highScore:helicopter';

interface Slice {
  topH: number;
  botH: number;
}

function newField(): Slice[] {
  const slices: Slice[] = [];
  for (let i = 0; i < W / SLICE_W + 4; i++) {
    slices.push({ topH: 30, botH: 30 });
  }
  return slices;
}

export default function GameHelicopter() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    y: H / 2,
    vy: 0,
    slices: newField(),
    obstacles: [] as { x: number; y: number; h: number }[],
    pressing: false,
    speed: 3,
    score: 0,
    spawnTimer: 60,
    drift: 0,
  });
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#14532d';
    s.slices.forEach((slice, i) => {
      const x = i * SLICE_W - (s.score % SLICE_W);
      ctx.fillRect(x, 0, SLICE_W + 1, slice.topH);
      ctx.fillRect(x, H - slice.botH, SLICE_W + 1, slice.botH);
    });

    ctx.fillStyle = '#a855f7';
    for (const o of s.obstacles) {
      ctx.fillRect(o.x, o.y, 14, o.h);
    }

    ctx.fillStyle = '#fde047';
    ctx.fillRect(HELI_X, s.y, HELI_W, HELI_H);
    ctx.fillStyle = '#000';
    ctx.fillRect(HELI_X + HELI_W - 6, s.y + 4, 3, 3);
    ctx.fillStyle = '#737373';
    ctx.fillRect(HELI_X + 2, s.y - 4, HELI_W - 4, 2);
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    s.vy += s.pressing ? -0.4 : 0.35;
    s.vy *= 0.96;
    s.y += s.vy;

    s.drift += (Math.random() - 0.5) * 0.6;
    s.drift = Math.max(-2, Math.min(2, s.drift));
    const front = s.slices[s.slices.length - 1];
    let nextTop = front.topH + s.drift;
    let nextBot = front.botH - s.drift;
    nextTop = Math.max(20, Math.min(H - 100, nextTop));
    nextBot = Math.max(20, Math.min(H - 100, nextBot));
    s.slices.shift();
    s.slices.push({ topH: nextTop, botH: nextBot });

    if (s.y < s.slices[Math.floor(HELI_X / SLICE_W) + 4].topH || s.y + HELI_H > H - s.slices[Math.floor(HELI_X / SLICE_W) + 4].botH) {
      endGame();
      return;
    }

    s.spawnTimer--;
    if (s.spawnTimer <= 0) {
      s.spawnTimer = 80 + Math.floor(Math.random() * 60);
      const h = 40 + Math.random() * 60;
      const y = 40 + Math.random() * (H - 100 - h);
      s.obstacles.push({ x: W + 20, y, h });
    }

    for (const o of s.obstacles) o.x -= s.speed;
    s.obstacles = s.obstacles.filter((o) => o.x + 14 > 0);

    for (const o of s.obstacles) {
      if (HELI_X + HELI_W > o.x && HELI_X < o.x + 14 && s.y + HELI_H > o.y && s.y < o.y + o.h) {
        endGame();
        return;
      }
    }

    s.score += 1;
    setScore(s.score);
    if (s.score % 500 === 0) s.speed += 0.3;

    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  const endGame = useCallback(() => {
    setRunning(false);
    setOver(true);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setHighScore((h) => {
      if (stateRef.current.score > h) {
        localStorage.setItem(STORAGE_KEY, String(stateRef.current.score));
        return stateRef.current.score;
      }
      return h;
    });
  }, []);

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
    function down(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        stateRef.current.pressing = true;
      }
    }
    function up(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'ArrowUp') stateRef.current.pressing = false;
    }
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  function start() {
    stateRef.current = {
      y: H / 2,
      vy: 0,
      slices: newField(),
      obstacles: [],
      pressing: false,
      speed: 3,
      score: 0,
      spawnTimer: 60,
      drift: 0,
    };
    setScore(0);
    setOver(false);
    setRunning(true);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">{t('score')}: {score}</span>
        <span className="text-neutral-400">
          {t('highScore')}: <span className="text-neutral-100">{highScore}</span>
        </span>
      </div>

      {over && <div className="rounded bg-rose-500/20 px-4 py-2 font-mono text-rose-300">Game Over · {score}</div>}

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onMouseDown={() => (stateRef.current.pressing = true)}
        onMouseUp={() => (stateRef.current.pressing = false)}
        onMouseLeave={() => (stateRef.current.pressing = false)}
        onTouchStart={(e) => {
          e.preventDefault();
          stateRef.current.pressing = true;
        }}
        onTouchEnd={() => (stateRef.current.pressing = false)}
        className="touch-none rounded border border-neutral-800 cursor-pointer"
      />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}

      <p className="font-mono text-xs text-neutral-500">Hold Space/↑/mouse to thrust upward</p>
    </div>
  );
}
