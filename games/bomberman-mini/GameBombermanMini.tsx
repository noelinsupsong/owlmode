'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import TouchControls from '@/components/TouchControls';

const COLS = 13;
const ROWS = 11;
const CELL = 32;
const W = COLS * CELL;
const H = ROWS * CELL;
const STORAGE_KEY = 'highScore:bomberman-mini';

type Tile = 'empty' | 'wall' | 'brick';
interface Bomb { x: number; y: number; t: number; range: number; }
interface Explosion { x: number; y: number; t: number; }
interface Enemy { x: number; y: number; dir: { dx: number; dy: number }; alive: boolean; cooldown: number; }

function buildMap(): Tile[][] {
  const m: Tile[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < COLS; c++) {
      if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1 || (r % 2 === 0 && c % 2 === 0)) row.push('wall');
      else row.push('empty');
    }
    m.push(row);
  }
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (m[r][c] === 'empty' && Math.random() < 0.45) {
        if ((r <= 2 && c <= 2) || (r >= ROWS - 3 && c >= COLS - 3)) continue;
        m[r][c] = 'brick';
      }
    }
  }
  return m;
}

export default function GameBombermanMini() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    map: buildMap(),
    px: 1, py: 1,
    bombs: [] as Bomb[],
    explosions: [] as Explosion[],
    enemies: [] as Enemy[],
    score: 0,
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
        ctx.fillStyle = tile === 'wall' ? '#525252' : tile === 'brick' ? '#92400e' : '#16a34a';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        if (tile === 'wall') {
          ctx.fillStyle = '#737373';
          ctx.fillRect(c * CELL + 4, r * CELL + 4, CELL - 8, CELL - 8);
        } else if (tile === 'brick') {
          ctx.fillStyle = '#a16207';
          ctx.fillRect(c * CELL + 4, r * CELL + 4, CELL - 8, CELL - 8);
        }
      }
    }

    for (const b of s.bombs) {
      ctx.fillStyle = b.t > 30 ? '#000' : '#ef4444';
      ctx.beginPath();
      ctx.arc(b.x * CELL + CELL / 2, b.y * CELL + CELL / 2, CELL / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const ex of s.explosions) {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(ex.x * CELL + 4, ex.y * CELL + 4, CELL - 8, CELL - 8);
    }

    for (const e of s.enemies) {
      if (!e.alive) continue;
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(e.x * CELL + 4, e.y * CELL + 4, CELL - 8, CELL - 8);
    }

    ctx.fillStyle = '#fde047';
    ctx.fillRect(s.px * CELL + 4, s.py * CELL + 4, CELL - 8, CELL - 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(s.px * CELL + 10, s.py * CELL + 12, 3, 3);
    ctx.fillRect(s.px * CELL + 19, s.py * CELL + 12, 3, 3);
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;

    for (const b of s.bombs) b.t--;
    const exploded = s.bombs.filter((b) => b.t <= 0);
    s.bombs = s.bombs.filter((b) => b.t > 0);

    for (const b of exploded) {
      const cells: [number, number][] = [[b.x, b.y]];
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        for (let k = 1; k <= b.range; k++) {
          const nx = b.x + dx * k;
          const ny = b.y + dy * k;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) break;
          if (s.map[ny][nx] === 'wall') break;
          cells.push([nx, ny]);
          if (s.map[ny][nx] === 'brick') {
            s.map[ny][nx] = 'empty';
            s.score += 10;
            setScore(s.score);
            break;
          }
        }
      }
      for (const [x, y] of cells) s.explosions.push({ x, y, t: 20 });
    }

    for (const ex of s.explosions) ex.t--;
    s.explosions = s.explosions.filter((ex) => ex.t > 0);

    for (const ex of s.explosions) {
      if (ex.x === s.px && ex.y === s.py) { setOver('lose'); setRunning(false); return; }
      for (const e of s.enemies) {
        if (e.alive && e.x === ex.x && e.y === ex.y) {
          e.alive = false;
          s.score += 200;
          setScore(s.score);
        }
      }
    }

    for (const e of s.enemies) {
      if (!e.alive) continue;
      e.cooldown--;
      if (e.cooldown <= 0) {
        e.cooldown = 8;
        const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
        const valid = dirs.filter(d => {
          const nx = e.x + d.dx; const ny = e.y + d.dy;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return false;
          return s.map[ny][nx] === 'empty' && !s.bombs.some(b => b.x === nx && b.y === ny);
        });
        if (valid.length) {
          if (Math.random() < 0.7 && valid.includes(e.dir as { dx: number; dy: number; })) {
            // continue
          } else {
            e.dir = valid[Math.floor(Math.random() * valid.length)];
          }
          e.x += e.dir.dx;
          e.y += e.dir.dy;
        }
      }
      if (e.x === s.px && e.y === s.py) { setOver('lose'); setRunning(false); return; }
    }

    if (s.enemies.every(e => !e.alive)) { setOver('win'); setRunning(false); s.score += 500; setScore(s.score); return; }

    draw();
  }, [draw]);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
    draw();
  }, [draw]);

  useEffect(() => {
    if (!running) return;
    tickerRef.current = setInterval(tick, 80);
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
      let nx = s.px, ny = s.py;
      if (e.key === 'ArrowUp' || e.key === 'w') ny--;
      else if (e.key === 'ArrowDown' || e.key === 's') ny++;
      else if (e.key === 'ArrowLeft' || e.key === 'a') nx--;
      else if (e.key === 'ArrowRight' || e.key === 'd') nx++;
      else if (e.key === ' ') {
        e.preventDefault();
        if (!s.bombs.some(b => b.x === s.px && b.y === s.py)) {
          s.bombs.push({ x: s.px, y: s.py, t: 60, range: 2 });
        }
        return;
      } else return;
      e.preventDefault();
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && s.map[ny][nx] === 'empty' && !s.bombs.some(b => b.x === nx && b.y === ny)) {
        s.px = nx; s.py = ny;
      }
      draw();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, draw]);

  function start() {
    stateRef.current = {
      map: buildMap(),
      px: 1, py: 1,
      bombs: [],
      explosions: [],
      enemies: [
        { x: COLS - 2, y: ROWS - 2, dir: { dx: -1, dy: 0 }, alive: true, cooldown: 0 },
        { x: COLS - 2, y: 1, dir: { dx: 0, dy: 1 }, alive: true, cooldown: 0 },
        { x: 1, y: ROWS - 2, dir: { dx: 1, dy: 0 }, alive: true, cooldown: 0 },
      ],
      score: 0,
    };
    setScore(0); setOver(null); setRunning(true);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">{t('score')}: {score}</span>
        <span className="text-neutral-400">{t('highScore')}: <span className="text-neutral-100">{highScore}</span></span>
      </div>
      {over && <div className={`rounded px-4 py-2 font-mono ${over === 'win' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>{over === 'win' ? '🎉 Cleared!' : '💥 Boom!'}</div>}
      <canvas ref={canvasRef} width={W} height={H} className="rounded border border-neutral-800" />
      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}
      <p className="font-mono text-xs text-neutral-500">↑↓←→/WASD: move · Space: drop bomb</p>

      <TouchControls preset="dpad-bomb" />
    </div>
  );
}
