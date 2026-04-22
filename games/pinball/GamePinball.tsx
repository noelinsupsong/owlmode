'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const W = 360;
const H = 540;
const BALL_R = 8;
const FLIPPER_LEN = 70;
const STORAGE_KEY = 'highScore:pinball';

interface Bumper { x: number; y: number; r: number; pts: number; color: string; }

const BUMPERS: Bumper[] = [
  { x: 100, y: 130, r: 24, pts: 100, color: '#ef4444' },
  { x: 260, y: 130, r: 24, pts: 100, color: '#3b82f6' },
  { x: 180, y: 90, r: 24, pts: 150, color: '#facc15' },
  { x: 80, y: 240, r: 18, pts: 50, color: '#22c55e' },
  { x: 280, y: 240, r: 18, pts: 50, color: '#22c55e' },
  { x: 180, y: 200, r: 16, pts: 75, color: '#a855f7' },
];

export default function GamePinball() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    bx: W / 2 - 30,
    by: H - 80,
    vx: 0,
    vy: 0,
    leftAngle: 0.4,
    rightAngle: -0.4,
    leftActive: false,
    rightActive: false,
    score: 0,
    lives: 3,
    launching: true,
    bumperHits: BUMPERS.map(() => 0),
  });
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

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.quadraticCurveTo(W / 2, 0, W, 50);
    ctx.lineTo(W, H);
    ctx.lineTo(W - 30, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(0, H);
    ctx.lineTo(30, H);
    ctx.stroke();

    BUMPERS.forEach((b, i) => {
      const flash = s.bumperHits[i] > 0;
      ctx.fillStyle = flash ? '#fff' : b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(b.pts), b.x, b.y + 4);
      if (s.bumperHits[i] > 0) s.bumperHits[i]--;
    });

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(s.bx, s.by, BALL_R, 0, Math.PI * 2);
    ctx.fill();

    const flipperBaseY = H - 60;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(60, flipperBaseY);
    ctx.lineTo(60 + FLIPPER_LEN * Math.cos(s.leftAngle), flipperBaseY + FLIPPER_LEN * Math.sin(s.leftAngle));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - 60, flipperBaseY);
    ctx.lineTo(W - 60 + FLIPPER_LEN * Math.cos(Math.PI - s.rightAngle), flipperBaseY + FLIPPER_LEN * Math.sin(Math.PI - s.rightAngle));
    ctx.stroke();

    ctx.fillStyle = '#737373';
    ctx.fillRect(W - 18, H - 120, 12, 80);
    if (s.launching) {
      ctx.fillStyle = '#facc15';
      ctx.fillText('SPACE to launch', W - 50, H - 130);
    }
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;

    if (s.leftActive) s.leftAngle = Math.max(-0.6, s.leftAngle - 0.25);
    else s.leftAngle = Math.min(0.4, s.leftAngle + 0.15);
    if (s.rightActive) s.rightAngle = Math.min(0.6, s.rightAngle + 0.25);
    else s.rightAngle = Math.max(-0.4, s.rightAngle - 0.15);

    if (!s.launching) {
      s.vy += 0.25;
      s.bx += s.vx;
      s.by += s.vy;

      if (s.bx < BALL_R) { s.bx = BALL_R; s.vx = -s.vx * 0.7; }
      if (s.bx > W - BALL_R) { s.bx = W - BALL_R; s.vx = -s.vx * 0.7; }
      if (s.by < BALL_R + 20) { s.by = BALL_R + 20; s.vy = -s.vy * 0.7; }

      BUMPERS.forEach((b, i) => {
        const dx = s.bx - b.x;
        const dy = s.by - b.y;
        const d = Math.hypot(dx, dy);
        if (d < b.r + BALL_R) {
          const nx = dx / d;
          const ny = dy / d;
          const dot = s.vx * nx + s.vy * ny;
          s.vx = (s.vx - 2 * dot * nx) * 1.05;
          s.vy = (s.vy - 2 * dot * ny) * 1.05;
          s.bx = b.x + nx * (b.r + BALL_R);
          s.by = b.y + ny * (b.r + BALL_R);
          s.score += b.pts;
          s.bumperHits[i] = 5;
          setScore(s.score);
        }
      });

      const flipperBaseY = H - 60;
      const flipperHit = (baseX: number, angle: number, dir: 1 | -1) => {
        const tipX = baseX + FLIPPER_LEN * Math.cos(angle * dir + (dir < 0 ? Math.PI : 0));
        const tipY = flipperBaseY + FLIPPER_LEN * Math.sin(angle * dir + (dir < 0 ? Math.PI : 0));
        const ax = tipX - baseX;
        const ay = tipY - flipperBaseY;
        const len2 = ax * ax + ay * ay;
        const tt = Math.max(0, Math.min(1, ((s.bx - baseX) * ax + (s.by - flipperBaseY) * ay) / len2));
        const cx = baseX + ax * tt;
        const cy = flipperBaseY + ay * tt;
        const dist = Math.hypot(s.bx - cx, s.by - cy);
        if (dist < BALL_R + 5) {
          const nx = (s.bx - cx) / dist;
          const ny = (s.by - cy) / dist;
          const dot = s.vx * nx + s.vy * ny;
          s.vx = (s.vx - 2 * dot * nx) * 1.1;
          s.vy = (s.vy - 2 * dot * ny) * 1.1 - 3;
          s.bx = cx + nx * (BALL_R + 6);
          s.by = cy + ny * (BALL_R + 6);
          s.score += 10;
          setScore(s.score);
        }
      };
      flipperHit(60, s.leftAngle, 1);
      flipperHit(W - 60, Math.PI - s.rightAngle, -1);

      if (s.by > H + 20) {
        s.lives--;
        setLives(s.lives);
        if (s.lives <= 0) { endGame(); return; }
        s.bx = W - 12; s.by = H - 80; s.vx = 0; s.vy = 0;
        s.launching = true;
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
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a') s.leftActive = true;
      if (e.key === 'ArrowRight' || e.key === 'd') s.rightActive = true;
      if (e.key === ' ' && s.launching) {
        e.preventDefault();
        s.vx = -2 - Math.random() * 2;
        s.vy = -10 - Math.random() * 3;
        s.launching = false;
      }
    }
    function up(e: KeyboardEvent) {
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a') s.leftActive = false;
      if (e.key === 'ArrowRight' || e.key === 'd') s.rightActive = false;
    }
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  function start() {
    stateRef.current = {
      bx: W - 12, by: H - 80, vx: 0, vy: 0,
      leftAngle: 0.4, rightAngle: -0.4,
      leftActive: false, rightActive: false,
      score: 0, lives: 3, launching: true,
      bumperHits: BUMPERS.map(() => 0),
    };
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
      <p className="font-mono text-xs text-neutral-500">←/A: left flipper · →/D: right flipper · Space: launch ball</p>
    </div>
  );
}
