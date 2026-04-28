'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import TouchControls from '@/components/TouchControls';

const W = 480;
const H = 480;
const PLAYER_W = 32;
const PLAYER_H = 24;
const STORAGE_KEY = 'highScore:galaxy-shooter';

interface Bullet { x: number; y: number; vx: number; vy: number; }
interface Enemy { x: number; y: number; t: number; pattern: 'wave' | 'dive' | 'cross'; alive: boolean; hp: number; }

function spawnEnemy(): Enemy {
  const r = Math.random();
  const pattern: Enemy['pattern'] = r < 0.4 ? 'wave' : r < 0.75 ? 'dive' : 'cross';
  return {
    x: 40 + Math.random() * (W - 80),
    y: -20,
    t: 0,
    pattern,
    alive: true,
    hp: pattern === 'cross' ? 2 : 1,
  };
}

export default function GameGalaxyShooter() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    px: W / 2 - PLAYER_W / 2,
    bullets: [] as Bullet[],
    enemyBullets: [] as Bullet[],
    enemies: [] as Enemy[],
    spawnTimer: 0,
    cooldown: 0,
    score: 0,
    lives: 3,
  });
  const keysRef = useRef<Set<string>>(new Set());
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
    const s = stateRef.current;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff';
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 73) % W);
      const sy = ((i * 137 + Date.now() * 0.05) % H);
      ctx.fillRect(sx, sy, 1, 1);
    }

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(s.px, H - 40, PLAYER_W, PLAYER_H);
    ctx.fillRect(s.px + PLAYER_W / 2 - 3, H - 48, 6, 8);

    ctx.fillStyle = '#facc15';
    for (const b of s.bullets) ctx.fillRect(b.x - 1, b.y - 4, 3, 8);

    ctx.fillStyle = '#ef4444';
    for (const b of s.enemyBullets) ctx.fillRect(b.x - 1, b.y, 3, 6);

    for (const e of s.enemies) {
      if (!e.alive) continue;
      ctx.fillStyle = e.pattern === 'cross' ? '#a855f7' : e.pattern === 'dive' ? '#fb7185' : '#fb923c';
      ctx.fillRect(e.x - 12, e.y - 8, 24, 16);
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x - 6, e.y - 4, 3, 3);
      ctx.fillRect(e.x + 3, e.y - 4, 3, 3);
    }
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;

    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) s.px = Math.max(0, s.px - 5);
    if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) s.px = Math.min(W - PLAYER_W, s.px + 5);

    if (s.cooldown > 0) s.cooldown--;
    if ((keysRef.current.has(' ') || keysRef.current.has('z')) && s.cooldown <= 0) {
      s.bullets.push({ x: s.px + PLAYER_W / 2, y: H - 50, vx: 0, vy: -8 });
      s.cooldown = 8;
    }

    s.bullets = s.bullets.filter((b) => b.y > -10);
    for (const b of s.bullets) { b.x += b.vx; b.y += b.vy; }

    s.enemyBullets = s.enemyBullets.filter((b) => b.y < H + 10);
    for (const b of s.enemyBullets) { b.x += b.vx; b.y += b.vy; }

    s.spawnTimer--;
    if (s.spawnTimer <= 0) {
      s.spawnTimer = 50 + Math.floor(Math.random() * 40);
      s.enemies.push(spawnEnemy());
    }

    for (const e of s.enemies) {
      if (!e.alive) continue;
      e.t++;
      if (e.pattern === 'wave') {
        e.y += 1.4;
        e.x += Math.sin(e.t * 0.05) * 2;
      } else if (e.pattern === 'dive') {
        e.y += 2.5;
      } else {
        e.y += 0.8;
        e.x += Math.cos(e.t * 0.04) * 3;
      }
      if (e.t % 90 === 0 && Math.random() < 0.5) {
        s.enemyBullets.push({ x: e.x, y: e.y + 8, vx: 0, vy: 3.5 });
      }
    }
    s.enemies = s.enemies.filter((e) => e.alive && e.y < H + 30);

    for (const b of s.bullets) {
      for (const e of s.enemies) {
        if (!e.alive) continue;
        if (b.x > e.x - 12 && b.x < e.x + 12 && b.y > e.y - 8 && b.y < e.y + 8) {
          e.hp--;
          b.y = -100;
          if (e.hp <= 0) {
            e.alive = false;
            s.score += e.pattern === 'cross' ? 100 : 50;
            setScore(s.score);
          }
          break;
        }
      }
    }

    for (const b of s.enemyBullets) {
      if (b.x > s.px && b.x < s.px + PLAYER_W && b.y > H - 40 && b.y < H - 40 + PLAYER_H) {
        b.y = H + 100;
        s.lives--;
        setLives(s.lives);
        if (s.lives <= 0) { endGame(); return; }
      }
    }

    for (const e of s.enemies) {
      if (e.alive && e.x > s.px - 12 && e.x < s.px + PLAYER_W + 12 && e.y > H - 40 - 8 && e.y < H - 40 + PLAYER_H + 8) {
        e.alive = false;
        s.lives--;
        setLives(s.lives);
        if (s.lives <= 0) { endGame(); return; }
      }
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
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, tick]);

  useEffect(() => {
    function down(e: KeyboardEvent) {
      keysRef.current.add(e.key);
      if (e.key === ' ') e.preventDefault();
    }
    function up(e: KeyboardEvent) { keysRef.current.delete(e.key); }
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  function start() {
    stateRef.current = { px: W / 2 - PLAYER_W / 2, bullets: [], enemyBullets: [], enemies: [], spawnTimer: 30, cooldown: 0, score: 0, lives: 3 };
    setScore(0); setLives(3); setOver(false); setRunning(true);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">{t('score')}: {score}</span>
        <span className="text-rose-300">♥ {lives}</span>
        <span className="text-neutral-400">{t('highScore')}: <span className="text-neutral-100">{highScore}</span></span>
      </div>
      {over && <div className="rounded bg-rose-500/20 px-4 py-2 font-mono text-rose-300">Game Over · {score}</div>}
      <canvas ref={canvasRef} width={W} height={H} className="rounded border border-neutral-800" />
      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}
      <p className="font-mono text-xs text-neutral-500">←→/AD: move · Space/Z: fire</p>

      <TouchControls preset="lr-fire" />
    </div>
  );
}
