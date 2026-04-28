'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import TouchControls from '@/components/TouchControls';

const W = 480;
const H = 320;
const PADDLE_W = 8;
const PADDLE_H = 60;
const BALL = 8;
const STORAGE_KEY = 'highScore:pong';

export default function GamePong() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    py: H / 2 - PADDLE_H / 2,
    cy: H / 2 - PADDLE_H / 2,
    bx: W / 2,
    by: H / 2,
    vx: 4,
    vy: 3,
    pScore: 0,
    cScore: 0,
  });
  const upRef = useRef(false);
  const downRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [scores, setScores] = useState({ p: 0, c: 0 });
  const [highScore, setHighScore] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#404040';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(20, s.py, PADDLE_W, PADDLE_H);
    ctx.fillRect(W - 20 - PADDLE_W, s.cy, PADDLE_W, PADDLE_H);
    ctx.fillRect(s.bx - BALL / 2, s.by - BALL / 2, BALL, BALL);
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    const speed = 6;
    if (upRef.current) s.py = Math.max(0, s.py - speed);
    if (downRef.current) s.py = Math.min(H - PADDLE_H, s.py + speed);

    const target = s.by - PADDLE_H / 2;
    const cpuSpeed = 4;
    if (target < s.cy) s.cy = Math.max(0, s.cy - cpuSpeed);
    else if (target > s.cy) s.cy = Math.min(H - PADDLE_H, s.cy + cpuSpeed);

    s.bx += s.vx;
    s.by += s.vy;
    if (s.by <= BALL / 2 || s.by >= H - BALL / 2) s.vy = -s.vy;

    if (s.bx <= 20 + PADDLE_W && s.by >= s.py && s.by <= s.py + PADDLE_H) {
      s.vx = Math.abs(s.vx);
    }
    if (s.bx >= W - 20 - PADDLE_W && s.by >= s.cy && s.by <= s.cy + PADDLE_H) {
      s.vx = -Math.abs(s.vx);
    }

    if (s.bx < 0) {
      s.cScore++;
      setScores({ p: s.pScore, c: s.cScore });
      s.bx = W / 2;
      s.by = H / 2;
      s.vx = 4;
    }
    if (s.bx > W) {
      s.pScore++;
      setScores({ p: s.pScore, c: s.cScore });
      if (s.pScore > highScore) {
        setHighScore(s.pScore);
        localStorage.setItem(STORAGE_KEY, String(s.pScore));
      }
      s.bx = W / 2;
      s.by = H / 2;
      s.vx = -4;
    }

    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw, highScore]);

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
      if (e.key === 'ArrowUp' || e.key === 'w') upRef.current = true;
      if (e.key === 'ArrowDown' || e.key === 's') downRef.current = true;
    }
    function up(e: KeyboardEvent) {
      if (e.key === 'ArrowUp' || e.key === 'w') upRef.current = false;
      if (e.key === 'ArrowDown' || e.key === 's') downRef.current = false;
    }
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  function start() {
    stateRef.current = {
      py: H / 2 - PADDLE_H / 2,
      cy: H / 2 - PADDLE_H / 2,
      bx: W / 2,
      by: H / 2,
      vx: 4,
      vy: 3,
      pScore: 0,
      cScore: 0,
    };
    setScores({ p: 0, c: 0 });
    setRunning(true);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">YOU: {scores.p}</span>
        <span className="text-rose-300">CPU: {scores.c}</span>
        <span className="text-neutral-400">
          {t('highScore')}: <span className="text-neutral-100">{highScore}</span>
        </span>
      </div>

      <canvas ref={canvasRef} width={W} height={H} data-running={running} className="rounded border border-neutral-800" />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {t('start')}
        </button>
      )}

      <p className="font-mono text-xs text-neutral-500">↑↓ or W/S</p>

      <TouchControls preset="updown" />
    </div>
  );
}
