'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const COLS = 20;
const ROWS = 22;
const CELL = 20;
const W = COLS * CELL;
const H = ROWS * CELL;
const PLAYER_ZONE = 4;
const STORAGE_KEY = 'highScore:centipede';

interface Segment { x: number; y: number; dir: 1 | -1; head: boolean; }

function spawnCentipede(len = 8): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < len; i++) {
    segs.push({ x: COLS - 1 - i, y: 0, dir: -1, head: i === 0 });
  }
  return segs;
}

function spawnMushrooms(): boolean[][] {
  const grid: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  for (let i = 0; i < 30; i++) {
    const x = Math.floor(Math.random() * COLS);
    const y = 1 + Math.floor(Math.random() * (ROWS - PLAYER_ZONE - 2));
    grid[y][x] = true;
  }
  return grid;
}

export default function GameCentipede() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    px: COLS / 2, py: ROWS - 1,
    bullets: [] as { x: number; y: number }[],
    centipede: spawnCentipede(),
    mushrooms: spawnMushrooms(),
    cooldown: 0,
    moveTimer: 0,
    score: 0,
    level: 1,
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

    ctx.fillStyle = '#a16207';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (s.mushrooms[r][c]) {
          ctx.fillRect(c * CELL + 2, r * CELL + 2, CELL - 4, CELL - 4);
        }
      }
    }

    for (const seg of s.centipede) {
      ctx.fillStyle = seg.head ? '#fb7185' : '#22c55e';
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    }

    ctx.fillStyle = '#fde047';
    for (const b of s.bullets) ctx.fillRect(b.x * CELL + 7, b.y * CELL, 6, CELL);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(s.px * CELL + 2, s.py * CELL + 2, CELL - 4, CELL - 4);
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;

    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) s.px = Math.max(0, s.px - 0.25);
    if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) s.px = Math.min(COLS - 1, s.px + 0.25);
    if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) s.py = Math.max(ROWS - PLAYER_ZONE, s.py - 0.25);
    if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) s.py = Math.min(ROWS - 1, s.py + 0.25);

    if (s.cooldown > 0) s.cooldown--;
    if ((keysRef.current.has(' ') || keysRef.current.has('z')) && s.cooldown <= 0) {
      s.bullets.push({ x: Math.round(s.px), y: Math.round(s.py) - 1 });
      s.cooldown = 10;
    }

    for (const b of s.bullets) b.y -= 0.6;
    s.bullets = s.bullets.filter((b) => b.y > -1);

    s.bullets = s.bullets.filter((b) => {
      const bx = Math.round(b.x);
      const by = Math.round(b.y);
      if (by >= 0 && by < ROWS && s.mushrooms[by] && s.mushrooms[by][bx]) {
        s.mushrooms[by][bx] = false;
        s.score += 1;
        setScore(s.score);
        return false;
      }
      for (let i = 0; i < s.centipede.length; i++) {
        const seg = s.centipede[i];
        if (seg.x === bx && seg.y === by) {
          s.score += seg.head ? 100 : 10;
          setScore(s.score);
          if (by < ROWS && s.mushrooms[by]) s.mushrooms[by][bx] = true;
          s.centipede.splice(i, 1);
          if (s.centipede.length > 0 && i < s.centipede.length) s.centipede[i].head = true;
          return false;
        }
      }
      return true;
    });

    s.moveTimer++;
    if (s.moveTimer >= 8) {
      s.moveTimer = 0;
      for (const seg of s.centipede) {
        const nextX = seg.x + seg.dir;
        const blocked = nextX < 0 || nextX >= COLS || (s.mushrooms[seg.y] && s.mushrooms[seg.y][nextX]);
        if (blocked) {
          seg.y++;
          seg.dir = (seg.dir * -1) as 1 | -1;
        } else {
          seg.x = nextX;
        }
        if (seg.y >= ROWS) seg.y = 0;
      }
    }

    for (const seg of s.centipede) {
      if (Math.round(seg.x) === Math.round(s.px) && Math.round(seg.y) === Math.round(s.py)) {
        endGame();
        return;
      }
    }

    if (s.centipede.length === 0) {
      s.level++;
      s.centipede = spawnCentipede(8 + s.level);
      s.score += 100;
      setScore(s.score);
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
    function down(e: KeyboardEvent) { keysRef.current.add(e.key); if (e.key === ' ') e.preventDefault(); }
    function up(e: KeyboardEvent) { keysRef.current.delete(e.key); }
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  function start() {
    stateRef.current = {
      px: COLS / 2, py: ROWS - 1,
      bullets: [],
      centipede: spawnCentipede(),
      mushrooms: spawnMushrooms(),
      cooldown: 0,
      moveTimer: 0,
      score: 0,
      level: 1,
    };
    setScore(0); setOver(false); setRunning(true);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">{t('score')}: {score}</span>
        <span className="text-neutral-400">{t('highScore')}: <span className="text-neutral-100">{highScore}</span></span>
      </div>
      {over && <div className="rounded bg-rose-500/20 px-4 py-2 font-mono text-rose-300">Game Over · {score}</div>}
      <canvas ref={canvasRef} width={W} height={H} className="rounded border border-neutral-800" />
      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}
      <p className="font-mono text-xs text-neutral-500">↑↓←→/WASD: move (bottom 4 rows only) · Space/Z: fire</p>
    </div>
  );
}
