'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import TouchControls from '@/components/TouchControls';

const MAZE = [
  '###################',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.### # ###.####',
  '   #.#       #.#   ',
  '####.# ## ## #.####',
  '    .  #   #  .    ',
  '####.# ##### #.####',
  '   #.#       #.#   ',
  '####.# ##### #.####',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#..#.........#....#',
  '##.#.#.#####.#.#.##',
  '#....#...#...#....#',
  '#.######.#.######.#',
  '#.................#',
  '###################',
];

const ROWS = MAZE.length;
const COLS = MAZE[0].length;
const CELL = 18;
const STORAGE_KEY = 'highScore:maze-muncher';

type Pos = { x: number; y: number };
type Dir = 'up' | 'down' | 'left' | 'right' | 'none';

const DIR_VEC: Record<Exclude<Dir, 'none'>, Pos> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function isWall(grid: string[], x: number, y: number) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
  return grid[y][x] === '#';
}

function buildDots(): boolean[][] {
  return MAZE.map((row) => row.split('').map((c) => c === '.'));
}

export default function GameMazeMuncher() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Pos>({ x: 9, y: 15 });
  const dirRef = useRef<Dir>('none');
  const queuedRef = useRef<Dir>('none');
  const ghostsRef = useRef<{ pos: Pos; dir: Dir }[]>([]);
  const dotsRef = useRef<boolean[][]>(buildDots());
  const moveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState<'win' | 'lose' | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (MAZE[y][x] === '#') {
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        } else if (dotsRef.current[y][x]) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const p = playerRef.current;
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(p.x * CELL + CELL / 2, p.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    for (const g of ghostsRef.current) {
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(g.pos.x * CELL + CELL / 2, g.pos.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const tick = useCallback(() => {
    const p = playerRef.current;
    const queued = queuedRef.current;
    if (queued !== 'none') {
      const v = DIR_VEC[queued];
      if (!isWall(MAZE, p.x + v.x, p.y + v.y)) dirRef.current = queued;
    }
    const cur = dirRef.current;
    if (cur !== 'none') {
      const v = DIR_VEC[cur];
      if (!isWall(MAZE, p.x + v.x, p.y + v.y)) {
        p.x += v.x;
        p.y += v.y;
      }
    }

    if (dotsRef.current[p.y][p.x]) {
      dotsRef.current[p.y][p.x] = false;
      setScore((s) => s + 10);
    }

    for (const g of ghostsRef.current) {
      const dirs: (Exclude<Dir, 'none'>)[] = ['up', 'down', 'left', 'right'];
      const valid = dirs.filter((d) => !isWall(MAZE, g.pos.x + DIR_VEC[d].x, g.pos.y + DIR_VEC[d].y));
      if (valid.length === 0) continue;
      const dx = p.x - g.pos.x;
      const dy = p.y - g.pos.y;
      let pref: Exclude<Dir, 'none'> = valid[0];
      if (Math.random() < 0.5) {
        const target: Exclude<Dir, 'none'> =
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0 ? 'right' : 'left'
            : dy > 0 ? 'down' : 'up';
        pref = valid.includes(target) ? target : valid[Math.floor(Math.random() * valid.length)];
      } else {
        pref = valid[Math.floor(Math.random() * valid.length)];
      }
      const v = DIR_VEC[pref];
      g.pos.x += v.x;
      g.pos.y += v.y;
      if (g.pos.x === p.x && g.pos.y === p.y) {
        setOver('lose');
        setRunning(false);
      }
    }

    let dotsLeft = 0;
    for (const row of dotsRef.current) for (const d of row) if (d) dotsLeft++;
    if (dotsLeft === 0) {
      setOver('win');
      setRunning(false);
    }

    draw();
  }, [draw]);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
    draw();
  }, [draw]);

  useEffect(() => {
    if (!running) return;
    moveTimer.current = setInterval(tick, 200);
    return () => {
      if (moveTimer.current) clearInterval(moveTimer.current);
    };
  }, [running, tick]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, Dir> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        queuedRef.current = dir;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (over && score > highScore) {
      setHighScore(score);
      localStorage.setItem(STORAGE_KEY, String(score));
    }
  }, [over, score, highScore]);

  function start() {
    playerRef.current = { x: 9, y: 15 };
    dirRef.current = 'none';
    queuedRef.current = 'none';
    const spawns: Pos[] = [];
    for (let y = 0; y < ROWS && spawns.length < 3; y++) {
      for (let x = 0; x < COLS && spawns.length < 3; x++) {
        if (MAZE[y][x] !== '#' && MAZE[y][x] !== ' ' && Math.abs(y - 15) > 4) {
          spawns.push({ x, y });
        }
      }
    }
    ghostsRef.current = spawns.map((pos, i) => ({
      pos: { ...pos },
      dir: (['left', 'right', 'up'] as Dir[])[i] ?? 'left',
    }));
    dotsRef.current = buildDots();
    setScore(0);
    setOver(null);
    setRunning(true);
    draw();
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
          {over === 'win' ? '🎉 Cleared!' : '👻 Caught!'}
        </div>
      )}

      <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} data-running={running} className="rounded border border-neutral-800" />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}

      <p className="font-mono text-xs text-neutral-500">↑↓←→ or WASD</p>

      <TouchControls preset="dpad" />
    </div>
  );
}
