'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const W = 360;
const H = 540;
const PADDLE_R = 22;
const PUCK_R = 12;
const GOAL_W = 140;
const STORAGE_KEY = 'highScore:air-hockey';

export default function GameAirHockey() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    px: W / 2, py: H - 60,
    cx: W / 2, cy: 60,
    bx: W / 2, by: H / 2,
    bvx: 0, bvy: 0,
    ppx: W / 2, ppy: H - 60,
    pScore: 0,
    cScore: 0,
  });
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState<'win' | 'lose' | null>(null);
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
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo((W - GOAL_W) / 2, 0);
    ctx.lineTo((W + GOAL_W) / 2, 0);
    ctx.moveTo((W - GOAL_W) / 2, H);
    ctx.lineTo((W + GOAL_W) / 2, H);
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(s.px, s.py, PADDLE_R, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(s.cx, s.cy, PADDLE_R, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(s.bx, s.by, PUCK_R, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(s.cScore), W - 20, H / 2 - 8);
    ctx.fillText(String(s.pScore), W - 20, H / 2 + 24);
  }, []);

  const collide = useCallback((paddleX: number, paddleY: number, paddleVX: number, paddleVY: number) => {
    const s = stateRef.current;
    const dx = s.bx - paddleX;
    const dy = s.by - paddleY;
    const dist = Math.hypot(dx, dy);
    const minDist = PADDLE_R + PUCK_R;
    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      s.bx = paddleX + nx * minDist;
      s.by = paddleY + ny * minDist;
      const dot = s.bvx * nx + s.bvy * ny;
      s.bvx = s.bvx - 2 * dot * nx + paddleVX * 0.6;
      s.bvy = s.bvy - 2 * dot * ny + paddleVY * 0.6;
      const sp = Math.hypot(s.bvx, s.bvy);
      const maxSp = 12;
      if (sp > maxSp) {
        s.bvx = (s.bvx / sp) * maxSp;
        s.bvy = (s.bvy / sp) * maxSp;
      }
    }
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;

    const playerVX = s.px - s.ppx;
    const playerVY = s.py - s.ppy;
    s.ppx = s.px;
    s.ppy = s.py;

    const cpuTargetX = s.bx;
    const cpuTargetY = Math.min(H / 2 - PADDLE_R - 4, s.by + 30);
    s.cx += (cpuTargetX - s.cx) * 0.06;
    s.cy += (cpuTargetY - s.cy) * 0.06;
    s.cy = Math.max(PADDLE_R, Math.min(H / 2 - PADDLE_R, s.cy));

    s.bx += s.bvx;
    s.by += s.bvy;
    s.bvx *= 0.99;
    s.bvy *= 0.99;

    if (s.bx < PUCK_R) { s.bx = PUCK_R; s.bvx = -s.bvx; }
    if (s.bx > W - PUCK_R) { s.bx = W - PUCK_R; s.bvx = -s.bvx; }

    if (s.by < 0) {
      if (s.bx > (W - GOAL_W) / 2 && s.bx < (W + GOAL_W) / 2) {
        s.pScore++;
        setScores({ p: s.pScore, c: s.cScore });
        if (s.pScore >= 5) { endGame('win'); return; }
        s.bx = W / 2; s.by = H / 2; s.bvx = 0; s.bvy = 4;
      } else { s.by = PUCK_R; s.bvy = -s.bvy; }
    }
    if (s.by > H) {
      if (s.bx > (W - GOAL_W) / 2 && s.bx < (W + GOAL_W) / 2) {
        s.cScore++;
        setScores({ p: s.pScore, c: s.cScore });
        if (s.cScore >= 5) { endGame('lose'); return; }
        s.bx = W / 2; s.by = H / 2; s.bvx = 0; s.bvy = -4;
      } else { s.by = H - PUCK_R; s.bvy = -s.bvy; }
    }

    collide(s.px, s.py, playerVX, playerVY);
    collide(s.cx, s.cy, 0, 0);

    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw, collide]);

  const endGame = useCallback((result: 'win' | 'lose') => {
    setRunning(false);
    setOver(result);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (result === 'win') {
      setHighScore((h) => {
        const next = h + 1;
        localStorage.setItem(STORAGE_KEY, String(next));
        return next;
      });
    }
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

  function onMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!running) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    stateRef.current.px = Math.max(PADDLE_R, Math.min(W - PADDLE_R, x));
    stateRef.current.py = Math.max(H / 2 + PADDLE_R, Math.min(H - PADDLE_R, y));
  }

  function start() {
    stateRef.current = {
      px: W / 2, py: H - 60,
      cx: W / 2, cy: 60,
      bx: W / 2, by: H / 2,
      bvx: 0, bvy: 4,
      ppx: W / 2, ppy: H - 60,
      pScore: 0,
      cScore: 0,
    };
    setScores({ p: 0, c: 0 });
    setOver(null);
    setRunning(true);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-emerald-300">YOU: {scores.p}</span>
        <span className="text-rose-300">CPU: {scores.c}</span>
        <span className="text-neutral-400">Total Wins: <span className="text-neutral-100">{highScore}</span></span>
      </div>

      {over && <div className={`rounded px-4 py-2 font-mono ${over === 'win' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>{over === 'win' ? '🎉 Victory 5–' + scores.c : 'Lose ' + scores.p + '–5'}</div>}

      <canvas ref={canvasRef} width={W} height={H} data-running={running} onMouseMove={onMove} className="rounded border border-neutral-800 cursor-none" />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}

      <p className="max-w-md text-center font-mono text-xs text-neutral-500">
        Move the green paddle in the bottom half. Strike the yellow puck into the top goal. First to 5 wins!
      </p>
    </div>
  );
}
