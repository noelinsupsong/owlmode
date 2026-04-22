'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const COLS = 13;
const ROW_H = 36;
const VISIBLE_ROWS = 12;
const W = COLS * 32;
const H = VISIBLE_ROWS * ROW_H;
const PLAYER_SCREEN_ROW = 8;
const AUTO_SCROLL_PER_TICK = 0.012;
const STORAGE_KEY = 'highScore:crossy-road';

type RowType = 'grass' | 'road' | 'water';
interface Row {
  type: RowType;
  speed: number;
  movers: { x: number; size: number }[];
}

function newRow(): Row {
  const r = Math.random();
  if (r < 0.45) return { type: 'grass', speed: 0, movers: [] };
  if (r < 0.75) {
    const speed = (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 2);
    const movers: { x: number; size: number }[] = [];
    for (let i = 0; i < 3 + Math.floor(Math.random() * 2); i++) {
      movers.push({ x: Math.random() * W, size: 1 + Math.floor(Math.random() * 2) });
    }
    return { type: 'road', speed, movers };
  }
  const speed = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 1.5);
  const movers: { x: number; size: number }[] = [];
  for (let i = 0; i < 3; i++) {
    movers.push({ x: Math.random() * W, size: 2 + Math.floor(Math.random() * 2) });
  }
  return { type: 'water', speed, movers };
}

function buildInitial(): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < 4; i++) rows.push({ type: 'grass', speed: 0, movers: [] });
  for (let i = 0; i < 40; i++) rows.push(newRow());
  return rows;
}

export default function GameCrossyRoad() {
  const t = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    rows: [] as Row[],
    playerCol: 6,
    playerRow: 0,
    cameraRow: -PLAYER_SCREEN_ROW,
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

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    const cameraFloor = Math.floor(s.cameraRow);
    const yOffset = (s.cameraRow - cameraFloor) * ROW_H;

    for (let visIdx = 0; visIdx <= VISIBLE_ROWS + 1; visIdx++) {
      const rowIndex = cameraFloor + visIdx;
      if (rowIndex < 0) continue;
      const row = s.rows[rowIndex];
      if (!row) continue;
      const y = (VISIBLE_ROWS - visIdx) * ROW_H - ROW_H + yOffset;
      let bg = '#14532d';
      if (row.type === 'road') bg = '#262626';
      else if (row.type === 'water') bg = '#1e3a8a';
      ctx.fillStyle = bg;
      ctx.fillRect(0, y, W, ROW_H);
      for (const m of row.movers) {
        ctx.fillStyle = row.type === 'road' ? '#ef4444' : '#92400e';
        ctx.fillRect(m.x, y + 4, m.size * 32 - 4, ROW_H - 8);
      }
    }

    const playerScreenY = (VISIBLE_ROWS - (s.playerRow - cameraFloor)) * ROW_H - ROW_H + yOffset;
    const px = s.playerCol * 32 + 4;
    ctx.fillStyle = '#fde047';
    ctx.fillRect(px, playerScreenY + 4, 24, ROW_H - 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 4, playerScreenY + 6, 3, 3);
    ctx.fillRect(px + 17, playerScreenY + 6, 3, 3);
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;

    while (s.rows.length < s.playerRow + 40) s.rows.push(newRow());

    for (let visIdx = 0; visIdx <= VISIBLE_ROWS + 2; visIdx++) {
      const rowIndex = Math.floor(s.cameraRow) + visIdx;
      if (rowIndex < 0) continue;
      const row = s.rows[rowIndex];
      if (!row) continue;
      for (const m of row.movers) {
        m.x += row.speed;
        if (row.speed > 0 && m.x > W + 32) m.x = -m.size * 32;
        if (row.speed < 0 && m.x + m.size * 32 < 0) m.x = W;
      }
    }

    const playerRow = s.rows[s.playerRow];
    if (playerRow) {
      const px = s.playerCol * 32 + 16;
      if (playerRow.type === 'road') {
        for (const m of playerRow.movers) {
          if (px >= m.x && px <= m.x + m.size * 32) {
            endGame();
            return;
          }
        }
      } else if (playerRow.type === 'water') {
        const onLog = playerRow.movers.find((m) => px >= m.x && px <= m.x + m.size * 32);
        if (!onLog) {
          endGame();
          return;
        }
        s.playerCol += playerRow.speed / 32;
        if (s.playerCol < 0 || s.playerCol > COLS - 1) {
          endGame();
          return;
        }
      }
    }

    const targetCamera = s.playerRow - PLAYER_SCREEN_ROW;
    s.cameraRow += (targetCamera - s.cameraRow) * 0.1;
    s.cameraRow += AUTO_SCROLL_PER_TICK;

    if (s.cameraRow > s.playerRow - 1) {
      endGame();
      return;
    }

    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  const endGame = useCallback(() => {
    setRunning(false);
    setOver(true);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setHighScore((h) => {
      if (stateRef.current.playerRow > h) {
        localStorage.setItem(STORAGE_KEY, String(stateRef.current.playerRow));
        return stateRef.current.playerRow;
      }
      return h;
    });
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
    stateRef.current.rows = buildInitial();
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
    function onKey(e: KeyboardEvent) {
      if (!running) return;
      const s = stateRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w') {
        s.playerRow++;
        setScore(s.playerRow);
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        if (s.playerRow > 0) {
          s.playerRow--;
          setScore(s.playerRow);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        s.playerCol = Math.max(0, Math.round(s.playerCol - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        s.playerCol = Math.min(COLS - 1, Math.round(s.playerCol + 1));
      } else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running]);

  function start() {
    stateRef.current = {
      rows: buildInitial(),
      playerCol: 6,
      playerRow: 0,
      cameraRow: -PLAYER_SCREEN_ROW,
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

      {over && <div className="rounded bg-rose-500/20 px-4 py-2 font-mono text-rose-300">Game Over · {score}</div>}

      <canvas ref={canvasRef} width={W} height={H} className="rounded border border-neutral-800" />

      {!running && (
        <button onClick={start} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {over ? t('restart') : t('start')}
        </button>
      )}

      <p className="font-mono text-xs text-neutral-500">↑↓←→ or WASD · Don't stay still — the camera auto-scrolls</p>
    </div>
  );
}
