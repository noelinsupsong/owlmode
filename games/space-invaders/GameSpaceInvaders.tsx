'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import TouchControls from '@/components/TouchControls';

const W = 480;
const H = 360;
const PLAYER_W = 32;
const PLAYER_H = 14;
const ALIEN_W = 24;
const ALIEN_H = 16;
const BULLET_W = 3;
const BULLET_H = 8;
const STORAGE_KEY = 'highScore:space-invaders';

interface Pos {
  x: number;
  y: number;
}
interface Alien extends Pos {
  alive: boolean;
}

function spawnAliens(): Alien[] {
  const aliens: Alien[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      aliens.push({ x: 40 + c * 50, y: 30 + r * 30, alive: true });
    }
  }
  return aliens;
}

export default function GameSpaceInvaders() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    playerX: W / 2 - PLAYER_W / 2,
    bullets: [] as Pos[],
    enemyBullets: [] as Pos[],
    aliens: spawnAliens(),
    alienDir: 1,
    alienSpeed: 0.5,
    cooldown: 0,
    score: 0,
  });
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState<'win' | 'lose' | null>(null);
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

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(s.playerX, H - 30, PLAYER_W, PLAYER_H);
    ctx.fillRect(s.playerX + PLAYER_W / 2 - 2, H - 38, 4, 8);

    ctx.fillStyle = '#f43f5e';
    for (const a of s.aliens) {
      if (a.alive) ctx.fillRect(a.x, a.y, ALIEN_W, ALIEN_H);
    }

    ctx.fillStyle = '#facc15';
    for (const b of s.bullets) ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H);

    ctx.fillStyle = '#ef4444';
    for (const b of s.enemyBullets) ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H);
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) s.playerX = Math.max(0, s.playerX - 5);
    if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) s.playerX = Math.min(W - PLAYER_W, s.playerX + 5);

    s.bullets = s.bullets.filter((b) => b.y > -BULLET_H);
    for (const b of s.bullets) b.y -= 7;

    s.enemyBullets = s.enemyBullets.filter((b) => b.y < H);
    for (const b of s.enemyBullets) b.y += 4;

    let edge = false;
    for (const a of s.aliens) {
      if (!a.alive) continue;
      a.x += s.alienDir * s.alienSpeed;
      if (a.x <= 0 || a.x + ALIEN_W >= W) edge = true;
    }
    if (edge) {
      s.alienDir = -s.alienDir;
      for (const a of s.aliens) if (a.alive) a.y += 12;
    }

    if (Math.random() < 0.02) {
      const alive = s.aliens.filter((a) => a.alive);
      if (alive.length) {
        const a = alive[Math.floor(Math.random() * alive.length)];
        s.enemyBullets.push({ x: a.x + ALIEN_W / 2, y: a.y + ALIEN_H });
      }
    }

    for (const b of s.bullets) {
      for (const a of s.aliens) {
        if (a.alive && b.x > a.x && b.x < a.x + ALIEN_W && b.y < a.y + ALIEN_H && b.y > a.y) {
          a.alive = false;
          b.y = -100;
          s.score += 50;
          setScore(s.score);
        }
      }
    }

    for (const b of s.enemyBullets) {
      if (b.x > s.playerX && b.x < s.playerX + PLAYER_W && b.y > H - 30 && b.y < H - 30 + PLAYER_H) {
        end('lose');
        return;
      }
    }
    for (const a of s.aliens) {
      if (a.alive && a.y + ALIEN_H >= H - 30) {
        end('lose');
        return;
      }
    }
    if (s.aliens.every((a) => !a.alive)) {
      end('win');
      return;
    }

    if (s.cooldown > 0) s.cooldown--;
    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  const end = useCallback((result: 'win' | 'lose') => {
    setRunning(false);
    setOver(result);
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
      if (e.key === ' ' && running) {
        e.preventDefault();
        const s = stateRef.current;
        if (s.cooldown <= 0) {
          s.bullets.push({ x: s.playerX + PLAYER_W / 2 - 1, y: H - 38 });
          s.cooldown = 12;
        }
      }
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
  }, [running]);

  function start() {
    stateRef.current = {
      playerX: W / 2 - PLAYER_W / 2,
      bullets: [],
      enemyBullets: [],
      aliens: spawnAliens(),
      alienDir: 1,
      alienSpeed: 0.5,
      cooldown: 0,
      score: 0,
    };
    setScore(0);
    setOver(null);
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

      {over && (
        <div className={`rounded px-4 py-2 font-mono ${over === 'win' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
          {over === 'win' ? '🎉 Victory!' : '👽 Invaded'}
        </div>
      )}

      <canvas ref={canvasRef} width={W} height={H} data-running={running} className="rounded border border-neutral-800" />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}

      <p className="font-mono text-xs text-neutral-500">←→: move · Space: fire</p>

      <TouchControls preset="lr-fire" />
    </div>
  );
}
