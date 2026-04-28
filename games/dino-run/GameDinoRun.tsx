'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import TouchControls from '@/components/TouchControls';

const W = 600;
const H = 200;
const GROUND_Y = H - 20;
const DINO_X = 50;
const DINO_W = 30;
const DINO_H = 40;
const DUCK_H = 22;
const STORAGE_KEY = 'highScore:dino-run';

interface Obstacle {
  x: number;
  w: number;
  h: number;
  y: number;
  flying: boolean;
}

export default function GameDinoRun() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    y: GROUND_Y - DINO_H,
    vy: 0,
    ducking: false,
    obstacles: [] as Obstacle[],
    spawnTimer: 0,
    speed: 5,
    groundOffset: 0,
    score: 0,
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

    ctx.strokeStyle = '#a3a3a3';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = '#737373';
    for (let x = -s.groundOffset; x < W; x += 30) {
      ctx.fillRect(x, GROUND_Y + 4, 8, 2);
    }

    const dh = s.ducking ? DUCK_H : DINO_H;
    const dy = s.ducking ? GROUND_Y - DUCK_H : s.y;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(DINO_X, dy, DINO_W, dh);
    ctx.fillStyle = '#000';
    ctx.fillRect(DINO_X + DINO_W - 8, dy + 6, 4, 4);

    ctx.fillStyle = '#f43f5e';
    for (const o of s.obstacles) {
      ctx.fillRect(o.x, o.y, o.w, o.h);
      if (o.flying) {
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(o.x - 4, o.y + o.h / 2, 4, 2);
        ctx.fillStyle = '#f43f5e';
      }
    }
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;

    s.vy += 0.7;
    s.y += s.vy;
    if (s.y > GROUND_Y - DINO_H) {
      s.y = GROUND_Y - DINO_H;
      s.vy = 0;
    }

    s.groundOffset = (s.groundOffset + s.speed) % 30;

    s.spawnTimer--;
    if (s.spawnTimer <= 0) {
      s.spawnTimer = 60 + Math.floor(Math.random() * 80);
      const flying = Math.random() < 0.25 && s.score > 100;
      const w = flying ? 30 : 12 + Math.floor(Math.random() * 18);
      const h = flying ? 14 : 24 + Math.floor(Math.random() * 14);
      const y = flying ? GROUND_Y - 50 : GROUND_Y - h;
      s.obstacles.push({ x: W + 10, w, h, y, flying });
    }

    for (const o of s.obstacles) o.x -= s.speed;
    s.obstacles = s.obstacles.filter((o) => o.x + o.w > 0);

    const dh = s.ducking ? DUCK_H : DINO_H;
    const dy = s.ducking ? GROUND_Y - DUCK_H : s.y;
    for (const o of s.obstacles) {
      if (DINO_X + DINO_W - 4 > o.x && DINO_X + 4 < o.x + o.w && dy + dh - 4 > o.y && dy + 4 < o.y + o.h) {
        endGame();
        return;
      }
    }

    s.score++;
    setScore(s.score);
    if (s.score % 250 === 0) s.speed += 0.5;

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
      if (!running) return;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        const s = stateRef.current;
        if (s.y >= GROUND_Y - DINO_H) s.vy = -12;
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        e.preventDefault();
        stateRef.current.ducking = true;
      }
    }
    function up(e: KeyboardEvent) {
      if (e.key === 'ArrowDown' || e.key === 's') stateRef.current.ducking = false;
    }
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [running]);

  function start() {
    stateRef.current = {
      y: GROUND_Y - DINO_H,
      vy: 0,
      ducking: false,
      obstacles: [],
      spawnTimer: 60,
      speed: 5,
      groundOffset: 0,
      score: 0,
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

      <canvas ref={canvasRef} width={W} height={H} data-running={running} className="rounded border border-neutral-800" />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}

      <p className="font-mono text-xs text-neutral-500">Space/↑: jump · ↓: duck</p>

      <TouchControls preset="jump-duck" />
    </div>
  );
}
