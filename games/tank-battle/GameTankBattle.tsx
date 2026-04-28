'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import TouchControls from '@/components/TouchControls';

const COLS = 17;
const ROWS = 13;
const CELL = 28;
const W = COLS * CELL;
const H = ROWS * CELL;
const STORAGE_KEY = 'highScore:tank-battle';

type Tile = 'empty' | 'wall' | 'brick';
type Dir = 'up' | 'down' | 'left' | 'right';
const DIR_VEC: Record<Dir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 },
};

interface Tank { x: number; y: number; dir: Dir; cooldown: number; alive: boolean; isPlayer: boolean; }
interface Bullet { x: number; y: number; dir: Dir; fromPlayer: boolean; }

function buildMap(): Tile[][] {
  const m: Tile[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < COLS; c++) {
      if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) row.push('wall');
      else if ((r + c) % 5 === 0 && Math.random() < 0.6) row.push('brick');
      else if (Math.random() < 0.1) row.push('brick');
      else row.push('empty');
    }
    m.push(row);
  }
  m[1][1] = 'empty'; m[1][2] = 'empty'; m[2][1] = 'empty';
  return m;
}

export default function GameTankBattle() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    map: buildMap(),
    player: { x: 1, y: 1, dir: 'right' as Dir, cooldown: 0, alive: true, isPlayer: true } as Tank,
    enemies: [] as Tank[],
    bullets: [] as Bullet[],
    aiTimer: 0,
    score: 0,
    wave: 1,
  });
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = s.map[r][c];
        ctx.fillStyle = tile === 'wall' ? '#525252' : tile === 'brick' ? '#92400e' : '#0a0a0a';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      }
    }

    const drawTank = (tk: Tank, color: string) => {
      if (!tk.alive) return;
      ctx.fillStyle = color;
      ctx.fillRect(tk.x * CELL + 3, tk.y * CELL + 3, CELL - 6, CELL - 6);
      const { dx, dy } = DIR_VEC[tk.dir];
      ctx.fillStyle = '#000';
      ctx.fillRect(tk.x * CELL + CELL / 2 - 2 + dx * 6, tk.y * CELL + CELL / 2 - 2 + dy * 6, 4, 4);
    };
    drawTank(s.player, '#22c55e');
    for (const e of s.enemies) drawTank(e, '#ef4444');

    ctx.fillStyle = '#fde047';
    for (const b of s.bullets) ctx.fillRect(b.x * CELL + CELL / 2 - 2, b.y * CELL + CELL / 2 - 2, 4, 4);
  }, []);

  const tryMove = useCallback((tank: Tank, dir: Dir) => {
    const s = stateRef.current;
    tank.dir = dir;
    const { dx, dy } = DIR_VEC[dir];
    const nx = tank.x + dx;
    const ny = tank.y + dy;
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return false;
    if (s.map[ny][nx] !== 'empty') return false;
    if (s.player.alive && tank !== s.player && nx === s.player.x && ny === s.player.y) return false;
    for (const e of s.enemies) {
      if (e !== tank && e.alive && e.x === nx && e.y === ny) return false;
    }
    tank.x = nx;
    tank.y = ny;
    return true;
  }, []);

  const fire = useCallback((tank: Tank) => {
    if (tank.cooldown > 0) return;
    tank.cooldown = 20;
    const { dx, dy } = DIR_VEC[tank.dir];
    stateRef.current.bullets.push({
      x: tank.x + dx, y: tank.y + dy, dir: tank.dir, fromPlayer: tank.isPlayer,
    });
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;

    if (s.player.cooldown > 0) s.player.cooldown--;
    for (const e of s.enemies) if (e.cooldown > 0) e.cooldown--;

    s.aiTimer++;
    if (s.aiTimer >= 8) {
      s.aiTimer = 0;
      for (const e of s.enemies) {
        if (!e.alive) continue;
        if (Math.random() < 0.3) {
          const dirs: Dir[] = ['up', 'down', 'left', 'right'];
          tryMove(e, dirs[Math.floor(Math.random() * 4)]);
        } else {
          tryMove(e, e.dir);
        }
        if ((e.x === s.player.x || e.y === s.player.y) && Math.random() < 0.2) {
          if (e.x === s.player.x) e.dir = e.y < s.player.y ? 'down' : 'up';
          else e.dir = e.x < s.player.x ? 'right' : 'left';
          fire(e);
        }
      }
    }

    for (const b of s.bullets) {
      const { dx, dy } = DIR_VEC[b.dir];
      b.x += dx;
      b.y += dy;
    }
    s.bullets = s.bullets.filter((b) => {
      if (b.x < 0 || b.y < 0 || b.x >= COLS || b.y >= ROWS) return false;
      const tile = s.map[b.y][b.x];
      if (tile === 'wall') return false;
      if (tile === 'brick') {
        s.map[b.y][b.x] = 'empty';
        return false;
      }
      if (b.fromPlayer) {
        for (const e of s.enemies) {
          if (e.alive && e.x === b.x && e.y === b.y) {
            e.alive = false;
            s.score += 100;
            setScore(s.score);
            return false;
          }
        }
      } else {
        if (s.player.alive && s.player.x === b.x && s.player.y === b.y) {
          setOver('lose');
          setRunning(false);
          return false;
        }
      }
      return true;
    });

    if (s.enemies.every((e) => !e.alive)) {
      setOver('win');
      setRunning(false);
    }

    draw();
  }, [draw, tryMove, fire]);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
    draw();
  }, [draw]);

  useEffect(() => {
    if (!running) return;
    tickerRef.current = setInterval(tick, 100);
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [running, tick]);

  useEffect(() => {
    if (!over) return;
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem(STORAGE_KEY, String(score));
    }
  }, [over, score, highScore]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!running) return;
      const s = stateRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w') { tryMove(s.player, 'up'); e.preventDefault(); }
      else if (e.key === 'ArrowDown' || e.key === 's') { tryMove(s.player, 'down'); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'a') { tryMove(s.player, 'left'); e.preventDefault(); }
      else if (e.key === 'ArrowRight' || e.key === 'd') { tryMove(s.player, 'right'); e.preventDefault(); }
      else if (e.key === ' ') { fire(s.player); e.preventDefault(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, tryMove, fire]);

  function start() {
    stateRef.current = {
      map: buildMap(),
      player: { x: 1, y: 1, dir: 'right', cooldown: 0, alive: true, isPlayer: true },
      enemies: [
        { x: COLS - 2, y: 1, dir: 'left', cooldown: 0, alive: true, isPlayer: false },
        { x: COLS - 2, y: ROWS - 2, dir: 'left', cooldown: 0, alive: true, isPlayer: false },
        { x: 1, y: ROWS - 2, dir: 'right', cooldown: 0, alive: true, isPlayer: false },
      ],
      bullets: [],
      aiTimer: 0,
      score: 0,
      wave: 1,
    };
    setScore(0); setOver(null); setRunning(true);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">{t('score')}: {score}</span>
        <span className="text-neutral-400">{t('highScore')}: <span className="text-neutral-100">{highScore}</span></span>
      </div>
      {over && <div className={`rounded px-4 py-2 font-mono ${over === 'win' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>{over === 'win' ? '🎉 Victory!' : '💥 Destroyed'}</div>}
      <canvas ref={canvasRef} width={W} height={H} data-running={running} className="rounded border border-neutral-800" />
      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}
      <p className="font-mono text-xs text-neutral-500">↑↓←→/WASD: move/turn · Space: fire</p>

      <TouchControls preset="dpad-fire" />
    </div>
  );
}
