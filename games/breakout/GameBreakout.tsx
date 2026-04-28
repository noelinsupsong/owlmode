'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import TouchControls from '@/components/TouchControls';

const W = 480;
const H = 360;
const PADDLE_W = 80;
const PADDLE_H = 10;
const BALL_R = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_W = 50;
const BRICK_H = 16;
const BRICK_PAD = 6;
const BRICK_OFFSET_X = 20;
const BRICK_OFFSET_Y = 30;
const STORAGE_KEY = 'highScore:breakout';

interface State {
  paddleX: number;
  ballX: number;
  ballY: number;
  vx: number;
  vy: number;
  bricks: boolean[];
  lives: number;
  score: number;
}

function initState(): State {
  return {
    paddleX: W / 2 - PADDLE_W / 2,
    ballX: W / 2,
    ballY: H - 30,
    vx: 3,
    vy: -3,
    bricks: Array(BRICK_ROWS * BRICK_COLS).fill(true),
    lives: 3,
    score: 0,
  };
}

const COLORS = ['#f43f5e', '#f59e0b', '#facc15', '#84cc16', '#06b6d4'];

export default function GameBreakout() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>(initState());
  const rafRef = useRef<number | null>(null);
  const leftRef = useRef(false);
  const rightRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);
  const [over, setOver] = useState<'win' | 'lose' | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        if (!s.bricks[r * BRICK_COLS + c]) continue;
        ctx.fillStyle = COLORS[r % COLORS.length];
        ctx.fillRect(
          BRICK_OFFSET_X + c * (BRICK_W + BRICK_PAD),
          BRICK_OFFSET_Y + r * (BRICK_H + BRICK_PAD),
          BRICK_W,
          BRICK_H
        );
      }
    }

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(s.paddleX, H - PADDLE_H - 4, PADDLE_W, PADDLE_H);

    ctx.beginPath();
    ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    const speed = 6;
    if (leftRef.current) s.paddleX = Math.max(0, s.paddleX - speed);
    if (rightRef.current) s.paddleX = Math.min(W - PADDLE_W, s.paddleX + speed);

    s.ballX += s.vx;
    s.ballY += s.vy;
    if (s.ballX <= BALL_R || s.ballX >= W - BALL_R) s.vx = -s.vx;
    if (s.ballY <= BALL_R) s.vy = -s.vy;

    if (
      s.ballY >= H - PADDLE_H - 4 - BALL_R &&
      s.ballX >= s.paddleX &&
      s.ballX <= s.paddleX + PADDLE_W
    ) {
      s.vy = -Math.abs(s.vy);
      const hit = (s.ballX - (s.paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
      s.vx = hit * 4;
    }

    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        if (!s.bricks[r * BRICK_COLS + c]) continue;
        const bx = BRICK_OFFSET_X + c * (BRICK_W + BRICK_PAD);
        const by = BRICK_OFFSET_Y + r * (BRICK_H + BRICK_PAD);
        if (s.ballX > bx && s.ballX < bx + BRICK_W && s.ballY > by && s.ballY < by + BRICK_H) {
          s.bricks[r * BRICK_COLS + c] = false;
          s.vy = -s.vy;
          s.score += 10;
          setScore(s.score);
        }
      }
    }

    if (s.ballY > H) {
      s.lives--;
      setLives(s.lives);
      if (s.lives <= 0) {
        setOver('lose');
        setRunning(false);
        setHighScore((h) => {
          if (s.score > h) {
            localStorage.setItem(STORAGE_KEY, String(s.score));
            return s.score;
          }
          return h;
        });
        draw();
        return;
      }
      s.ballX = W / 2;
      s.ballY = H - 30;
      s.vx = 3;
      s.vy = -3;
    }

    if (s.bricks.every((b) => !b)) {
      setOver('win');
      setRunning(false);
      setHighScore((h) => {
        if (s.score > h) {
          localStorage.setItem(STORAGE_KEY, String(s.score));
          return s.score;
        }
        return h;
      });
      draw();
      return;
    }

    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

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
      if (e.key === 'ArrowLeft' || e.key === 'a') leftRef.current = true;
      if (e.key === 'ArrowRight' || e.key === 'd') rightRef.current = true;
    }
    function up(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'a') leftRef.current = false;
      if (e.key === 'ArrowRight' || e.key === 'd') rightRef.current = false;
    }
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  function start() {
    stateRef.current = initState();
    setScore(0);
    setLives(3);
    setOver(null);
    setRunning(true);
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!running) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    stateRef.current.paddleX = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">{t('score')}: {score}</span>
        <span className="text-rose-300">♥ {lives}</span>
        <span className="text-neutral-400">
          {t('highScore')}: <span className="text-neutral-100">{highScore}</span>
        </span>
      </div>

      {over && (
        <div className={`rounded px-4 py-2 font-mono ${over === 'win' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
          {over === 'win' ? '🎉 You won!' : '💥 Game Over'}
        </div>
      )}

      <canvas ref={canvasRef} width={W} height={H} onMouseMove={onMouseMove} className="rounded border border-neutral-800" />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}

      <p className="font-mono text-xs text-neutral-500">Mouse / ←→ keys</p>

      <TouchControls preset="lr" />
    </div>
  );
}
