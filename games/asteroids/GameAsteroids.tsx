'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const W = 480;
const H = 360;
const STORAGE_KEY = 'highScore:asteroids';

interface Ship {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
}
interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}
interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

function newAsteroid(): Asteroid {
  const edge = Math.floor(Math.random() * 4);
  const x = edge === 0 ? 0 : edge === 1 ? W : Math.random() * W;
  const y = edge === 2 ? 0 : edge === 3 ? H : Math.random() * H;
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.6 + Math.random() * 1.2;
  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 30 };
}

function wrap(p: { x: number; y: number }) {
  if (p.x < 0) p.x += W;
  if (p.x > W) p.x -= W;
  if (p.y < 0) p.y += H;
  if (p.y > H) p.y -= H;
}

export default function GameAsteroids() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    ship: { x: W / 2, y: H / 2, angle: -Math.PI / 2, vx: 0, vy: 0 } as Ship,
    bullets: [] as Bullet[],
    asteroids: [] as Asteroid[],
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
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#a3a3a3';
    ctx.lineWidth = 1;
    for (const a of s.asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#fef08a';
    for (const b of s.bullets) {
      ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
    }

    const ship = s.ship;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.strokeStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, 6);
    ctx.lineTo(-8, -6);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    const ship = s.ship;

    if (keysRef.current.has('ArrowLeft')) ship.angle -= 0.08;
    if (keysRef.current.has('ArrowRight')) ship.angle += 0.08;
    if (keysRef.current.has('ArrowUp')) {
      ship.vx += Math.cos(ship.angle) * 0.15;
      ship.vy += Math.sin(ship.angle) * 0.15;
    }
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx;
    ship.y += ship.vy;
    wrap(ship);

    s.bullets = s.bullets.filter((b) => b.life > 0);
    for (const b of s.bullets) {
      b.x += b.vx;
      b.y += b.vy;
      wrap(b);
      b.life--;
    }

    for (const a of s.asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      wrap(a);
    }

    const remainingAsteroids: Asteroid[] = [];
    const remainingBullets: Bullet[] = [...s.bullets];
    for (const a of s.asteroids) {
      let hit = false;
      for (let i = 0; i < remainingBullets.length; i++) {
        const b = remainingBullets[i];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy < a.size * a.size) {
          hit = true;
          remainingBullets.splice(i, 1);
          s.score += 100;
          setScore(s.score);
          if (a.size > 16) {
            for (let k = 0; k < 2; k++) {
              const angle = Math.random() * Math.PI * 2;
              remainingAsteroids.push({
                x: a.x,
                y: a.y,
                vx: Math.cos(angle) * 1.5,
                vy: Math.sin(angle) * 1.5,
                size: a.size / 2,
              });
            }
          }
          break;
        }
      }
      if (!hit) remainingAsteroids.push(a);
    }
    s.asteroids = remainingAsteroids;
    s.bullets = remainingBullets;

    for (const a of s.asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (dx * dx + dy * dy < (a.size + 8) * (a.size + 8)) {
        endGame();
        return;
      }
    }

    if (s.asteroids.length < 4 && Math.random() < 0.005) {
      s.asteroids.push(newAsteroid());
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
      if (e.key === ' ' && running) {
        e.preventDefault();
        const s = stateRef.current;
        const ship = s.ship;
        s.bullets.push({
          x: ship.x + Math.cos(ship.angle) * 12,
          y: ship.y + Math.sin(ship.angle) * 12,
          vx: Math.cos(ship.angle) * 6,
          vy: Math.sin(ship.angle) * 6,
          life: 60,
        });
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
      ship: { x: W / 2, y: H / 2, angle: -Math.PI / 2, vx: 0, vy: 0 },
      bullets: [],
      asteroids: Array.from({ length: 4 }, newAsteroid),
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

      {over && (
        <div className="rounded bg-rose-500/20 px-4 py-2 font-mono text-rose-300">💥 Destroyed</div>
      )}

      <canvas ref={canvasRef} width={W} height={H} className="rounded border border-neutral-800" />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}

      <p className="font-mono text-xs text-neutral-500">←→: rotate · ↑: thrust · Space: fire</p>
    </div>
  );
}
