'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const W = 320;
const H = 480;
const BIRD_X = 80;
const BIRD_R = 12;
const GRAVITY = 0.45;
const FLAP = -7;
const PIPE_W = 50;
const PIPE_GAP = 130;
const PIPE_SPEED = 2.4;
const PIPE_INTERVAL = 1500;
const STORAGE_KEY = 'highScore:flappy';

interface Pipe {
  x: number;
  topH: number;
  passed: boolean;
}

export default function GameFlappy() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    y: H / 2,
    vy: 0,
    pipes: [] as Pipe[],
    lastPipeAt: 0,
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

    ctx.fillStyle = '#0c1f3a';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#22c55e';
    for (const p of s.pipes) {
      ctx.fillRect(p.x, 0, PIPE_W, p.topH);
      ctx.fillRect(p.x, p.topH + PIPE_GAP, PIPE_W, H - p.topH - PIPE_GAP);
    }

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(BIRD_X, s.y, BIRD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(BIRD_X + 4, s.y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const tick = useCallback(
    (timestamp: number) => {
      const s = stateRef.current;
      s.vy += GRAVITY;
      s.y += s.vy;

      for (const p of s.pipes) p.x -= PIPE_SPEED;
      s.pipes = s.pipes.filter((p) => p.x + PIPE_W > 0);

      if (timestamp - s.lastPipeAt > PIPE_INTERVAL) {
        const topH = 40 + Math.random() * (H - PIPE_GAP - 80);
        s.pipes.push({ x: W, topH, passed: false });
        s.lastPipeAt = timestamp;
      }

      for (const p of s.pipes) {
        if (!p.passed && p.x + PIPE_W < BIRD_X) {
          p.passed = true;
          s.score++;
          setScore(s.score);
        }
        if (
          BIRD_X + BIRD_R > p.x &&
          BIRD_X - BIRD_R < p.x + PIPE_W &&
          (s.y - BIRD_R < p.topH || s.y + BIRD_R > p.topH + PIPE_GAP)
        ) {
          endGame();
          return;
        }
      }

      if (s.y - BIRD_R < 0 || s.y + BIRD_R > H) {
        endGame();
        return;
      }

      draw();
      rafRef.current = requestAnimationFrame(tick);
    },
    [draw]
  );

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

  const flap = useCallback(() => {
    if (running) stateRef.current.vy = FLAP;
  }, [running]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flap]);

  function start() {
    stateRef.current = {
      y: H / 2,
      vy: 0,
      pipes: [],
      lastPipeAt: performance.now() + 800,
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
        <div className="rounded bg-rose-500/20 px-4 py-2 font-mono text-rose-300">Game Over · {score}</div>
      )}

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        data-running={running}
        onClick={flap}
        onTouchStart={(e) => {
          e.preventDefault();
          flap();
        }}
        className="rounded border border-neutral-800 cursor-pointer"
      />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}

      <p className="font-mono text-xs text-neutral-500">Space / Tap / ↑</p>
    </div>
  );
}
