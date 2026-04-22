'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const W = 320;
const H = 480;
const PLAYER_W = 28;
const PLAYER_H = 28;
const GRAVITY = 0.4;
const JUMP_V = -10;
const STORAGE_KEY = 'highScore:doodle-jump';

interface Platform {
  x: number;
  y: number;
  type: 'normal' | 'break' | 'move';
  vx?: number;
  broken?: boolean;
}

function newPlatform(y: number): Platform {
  const r = Math.random();
  const type = r < 0.7 ? 'normal' : r < 0.9 ? 'move' : 'break';
  return {
    x: Math.random() * (W - 60),
    y,
    type,
    vx: type === 'move' ? (Math.random() < 0.5 ? -1.5 : 1.5) : 0,
  };
}

function buildPlatforms(): Platform[] {
  const ps: Platform[] = [{ x: W / 2 - 30, y: H - 40, type: 'normal' }];
  for (let i = 1; i < 12; i++) {
    ps.push(newPlatform(H - 40 - i * 50));
  }
  return ps;
}

export default function GameDoodleJump() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    x: W / 2,
    y: H - 80,
    vx: 0,
    vy: 0,
    platforms: buildPlatforms(),
    score: 0,
  });
  const keysRef = useRef<Set<string>>(new Set());
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

    ctx.fillStyle = '#0c1f3a';
    ctx.fillRect(0, 0, W, H);

    for (const p of s.platforms) {
      if (p.broken) continue;
      ctx.fillStyle = p.type === 'break' ? '#a78bfa' : p.type === 'move' ? '#22d3ee' : '#22c55e';
      ctx.fillRect(p.x, p.y, 60, 8);
    }

    ctx.fillStyle = '#fde047';
    ctx.fillRect(s.x - PLAYER_W / 2, s.y - PLAYER_H, PLAYER_W, PLAYER_H);
    ctx.fillStyle = '#000';
    ctx.fillRect(s.x - 6, s.y - PLAYER_H + 6, 3, 3);
    ctx.fillRect(s.x + 3, s.y - PLAYER_H + 6, 3, 3);
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) s.vx = -5;
    else if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) s.vx = 5;
    else s.vx *= 0.8;

    s.vy += GRAVITY;
    s.x += s.vx;
    s.y += s.vy;

    if (s.x < 0) s.x = W;
    if (s.x > W) s.x = 0;

    if (s.vy > 0) {
      for (const p of s.platforms) {
        if (p.broken) continue;
        if (s.x > p.x && s.x < p.x + 60 && s.y > p.y && s.y < p.y + 12) {
          s.vy = JUMP_V;
          if (p.type === 'break') p.broken = true;
        }
      }
    }

    for (const p of s.platforms) {
      if (p.type === 'move' && p.vx) {
        p.x += p.vx;
        if (p.x < 0 || p.x > W - 60) p.vx = -p.vx;
      }
    }

    if (s.y < H / 2) {
      const dy = H / 2 - s.y;
      s.y = H / 2;
      for (const p of s.platforms) p.y += dy;
      s.score += Math.floor(dy);
      setScore(s.score);
    }

    s.platforms = s.platforms.filter((p) => p.y < H + 20);
    while (s.platforms.length < 12) {
      const minY = Math.min(...s.platforms.map((p) => p.y));
      s.platforms.push(newPlatform(minY - 50 - Math.random() * 30));
    }

    if (s.y > H + 50) {
      endGame();
      return;
    }

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
      keysRef.current.add(e.key);
    }
    function up(e: KeyboardEvent) {
      keysRef.current.delete(e.key);
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
      x: W / 2,
      y: H - 80,
      vx: 0,
      vy: JUMP_V,
      platforms: buildPlatforms(),
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

      <canvas ref={canvasRef} width={W} height={H} className="rounded border border-neutral-800" />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}

      <p className="font-mono text-xs text-neutral-500">←→ or A/D to move (sides wrap around)</p>
    </div>
  );
}
