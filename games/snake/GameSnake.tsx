'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const GRID = 20;
const CELL = 18;
const TICK_MS = 110;
const STORAGE_KEY = 'highScore:snake';

type Point = { x: number; y: number };
type Dir = 'up' | 'down' | 'left' | 'right';

const DIR_VEC: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function randomFood(snake: Point[]): Point {
  while (true) {
    const f = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
    if (!snake.some((s) => s.x === f.x && s.y === f.y)) return f;
  }
}

export default function GameSnake() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const dirRef = useRef<Dir>('right');
  const queuedDirRef = useRef<Dir | null>(null);
  const foodRef = useRef<Point>({ x: 5, y: 5 });
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#262626';
    for (let i = 0; i <= GRID; i++) {
      ctx.fillRect(i * CELL, 0, 1, canvas.height);
      ctx.fillRect(0, i * CELL, canvas.width, 1);
    }

    const food = foodRef.current;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);

    const snake = snakeRef.current;
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#fef08a' : '#a3e635';
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }, []);

  const tick = useCallback(() => {
    const queued = queuedDirRef.current;
    if (queued) {
      const cur = dirRef.current;
      const opposite =
        (cur === 'up' && queued === 'down') ||
        (cur === 'down' && queued === 'up') ||
        (cur === 'left' && queued === 'right') ||
        (cur === 'right' && queued === 'left');
      if (!opposite) dirRef.current = queued;
      queuedDirRef.current = null;
    }

    const snake = snakeRef.current;
    const head = snake[0];
    const v = DIR_VEC[dirRef.current];
    const newHead = { x: head.x + v.x, y: head.y + v.y };

    if (
      newHead.x < 0 ||
      newHead.x >= GRID ||
      newHead.y < 0 ||
      newHead.y >= GRID ||
      snake.some((s) => s.x === newHead.x && s.y === newHead.y)
    ) {
      setRunning(false);
      setGameOver(true);
      if (tickerRef.current) clearInterval(tickerRef.current);
      tickerRef.current = null;
      setScore((s) => {
        setHighScore((h) => {
          if (s > h) {
            localStorage.setItem(STORAGE_KEY, String(s));
            return s;
          }
          return h;
        });
        return s;
      });
      return;
    }

    const food = foodRef.current;
    const ate = newHead.x === food.x && newHead.y === food.y;
    const next = ate ? [newHead, ...snake] : [newHead, ...snake.slice(0, -1)];
    snakeRef.current = next;

    if (ate) {
      foodRef.current = randomFood(next);
      setScore((s) => s + 1);
    }

    draw();
  }, [draw]);

  const start = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = 'right';
    queuedDirRef.current = null;
    foodRef.current = randomFood(snakeRef.current);
    setScore(0);
    setGameOver(false);
    setRunning(true);
    draw();
  }, [draw]);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
    draw();
  }, [draw]);

  useEffect(() => {
    if (!running) return;
    tickerRef.current = setInterval(tick, TICK_MS);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      tickerRef.current = null;
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
        queuedDirRef.current = dir;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const touchStart = useRef<Point | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      queuedDirRef.current = dx > 0 ? 'right' : 'left';
    } else {
      queuedDirRef.current = dy > 0 ? 'down' : 'up';
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">
          {t('score')}: {score}
        </span>
        <span className="text-neutral-400">
          {t('highScore')}:{' '}
          <span className="text-neutral-100">{highScore}</span>
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={GRID * CELL}
        height={GRID * CELL}
        className="touch-none rounded border border-neutral-800"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />

      <div className="flex gap-3">
        {!running && (
          <button
            onClick={start}
            className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400"
          >
            {gameOver ? t('restart') : t('start')}
          </button>
        )}
      </div>

      <p className="font-mono text-xs text-neutral-500">
        Arrow keys / WASD / swipe
      </p>
    </div>
  );
}
