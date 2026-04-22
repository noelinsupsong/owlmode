'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const COLS = 4;
const ROWS = 5;
const CELL = 56;
const STORAGE_KEY = 'highScore:klotski';

interface Block {
  id: number;
  r: number;
  c: number;
  w: number;
  h: number;
  color: string;
  isGoal?: boolean;
}

interface Stage {
  name: string;
  description: string;
  blocks: () => Block[];
}

const STAGES: Stage[] = [
  {
    name: 'Stage 1 · Beginner',
    description: 'Very easy (3-5 moves)',
    blocks: () => [
      { id: 0, r: 0, c: 1, w: 2, h: 2, color: '#ef4444', isGoal: true },
      { id: 1, r: 0, c: 0, w: 1, h: 2, color: '#3b82f6' },
      { id: 2, r: 0, c: 3, w: 1, h: 2, color: '#3b82f6' },
    ],
  },
  {
    name: 'Stage 2 · Easy',
    description: 'Easy (10-15 moves)',
    blocks: () => [
      { id: 0, r: 0, c: 1, w: 2, h: 2, color: '#ef4444', isGoal: true },
      { id: 1, r: 0, c: 0, w: 1, h: 2, color: '#3b82f6' },
      { id: 2, r: 0, c: 3, w: 1, h: 2, color: '#3b82f6' },
      { id: 5, r: 2, c: 1, w: 2, h: 1, color: '#facc15' },
      { id: 6, r: 4, c: 0, w: 1, h: 1, color: '#a855f7' },
      { id: 7, r: 4, c: 3, w: 1, h: 1, color: '#a855f7' },
    ],
  },
  {
    name: 'Stage 3 · Hua Rong Dao',
    description: 'Classic Hua Rong Dao (81 moves)',
    blocks: () => [
      { id: 0, r: 0, c: 1, w: 2, h: 2, color: '#ef4444', isGoal: true },
      { id: 1, r: 0, c: 0, w: 1, h: 2, color: '#3b82f6' },
      { id: 2, r: 0, c: 3, w: 1, h: 2, color: '#3b82f6' },
      { id: 3, r: 2, c: 0, w: 1, h: 2, color: '#22c55e' },
      { id: 4, r: 2, c: 3, w: 1, h: 2, color: '#22c55e' },
      { id: 5, r: 2, c: 1, w: 2, h: 1, color: '#facc15' },
      { id: 6, r: 4, c: 0, w: 1, h: 1, color: '#a855f7' },
      { id: 7, r: 4, c: 1, w: 1, h: 1, color: '#a855f7' },
      { id: 8, r: 4, c: 2, w: 1, h: 1, color: '#a855f7' },
      { id: 9, r: 4, c: 3, w: 1, h: 1, color: '#a855f7' },
    ],
  },
];

function canMove(blocks: Block[], id: number, dr: number, dc: number): boolean {
  const block = blocks.find((b) => b.id === id);
  if (!block) return false;
  const nr = block.r + dr;
  const nc = block.c + dc;
  if (nr < 0 || nc < 0 || nr + block.h > ROWS || nc + block.w > COLS) return false;
  for (let r = nr; r < nr + block.h; r++) {
    for (let c = nc; c < nc + block.w; c++) {
      const occ = blocks.find(
        (b) => b.id !== id && r >= b.r && r < b.r + b.h && c >= b.c && c < b.c + b.w
      );
      if (occ) return false;
    }
  }
  return true;
}

export default function GameKlotski() {
  const t = useTranslations('common');
  const [stageIdx, setStageIdx] = useState(0);
  const [blocks, setBlocks] = useState<Block[]>(() => STAGES[0].blocks());
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const dragRef = useRef<{ id: number; startX: number; startY: number } | null>(null);

  const goal = blocks.find((b) => b.isGoal);
  const won = goal !== undefined && goal.r === 3 && goal.c === 1;
  const stage = STAGES[stageIdx];

  const reset = useCallback(
    (idx: number = stageIdx) => {
      setBlocks(STAGES[idx].blocks());
      setMoves(0);
      setSelected(null);
    },
    [stageIdx]
  );

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) setBestMoves(parsed);
      } catch {
        // ignore legacy formats
      }
    }
  }, []);

  useEffect(() => {
    if (!won) return;
    const cur = bestMoves[stageIdx];
    if (cur === undefined || moves < cur) {
      const next = { ...bestMoves, [stageIdx]: moves };
      setBestMoves(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, [won, moves, bestMoves, stageIdx]);

  function changeStage(idx: number) {
    setStageIdx(idx);
    reset(idx);
  }

  const move = useCallback((id: number, dr: number, dc: number) => {
    setBlocks((prev) => {
      if (!canMove(prev, id, dr, dc)) return prev;
      return prev.map((b) => (b.id === id ? { ...b, r: b.r + dr, c: b.c + dc } : b));
    });
    setMoves((m) => m + 1);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (won || selected === null) return;
      if (e.key === 'ArrowUp' || e.key === 'w') { move(selected, -1, 0); e.preventDefault(); }
      else if (e.key === 'ArrowDown' || e.key === 's') { move(selected, 1, 0); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'a') { move(selected, 0, -1); e.preventDefault(); }
      else if (e.key === 'ArrowRight' || e.key === 'd') { move(selected, 0, 1); e.preventDefault(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, won, move]);

  function handleMouseDown(e: React.MouseEvent, id: number) {
    setSelected(id);
    dragRef.current = { id, startX: e.clientX, startY: e.clientY };
  }
  function handleMouseUp(e: React.MouseEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      dragRef.current = null;
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      move(d.id, 0, dx > 0 ? 1 : -1);
    } else {
      move(d.id, dy > 0 ? 1 : -1, 0);
    }
    dragRef.current = null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">Moves: {moves}</span>
        <span className="text-neutral-400">
          Best: <span className="text-neutral-100">{bestMoves[stageIdx] ?? '—'}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
        <span className="text-neutral-400">Stage</span>
        {STAGES.map((s, i) => (
          <button
            key={i}
            onClick={() => changeStage(i)}
            className={`rounded px-3 py-1 ${stageIdx === i ? 'bg-amber-500 text-neutral-900' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
          >
            {i + 1}
            {bestMoves[i] !== undefined && ' ✓'}
          </button>
        ))}
      </div>

      <div className="text-center font-mono text-sm">
        <div className="text-amber-300">{stage.name}</div>
        <div className="text-xs text-neutral-500">{stage.description}</div>
      </div>

      {won && (
        <div className="flex flex-col items-center gap-2">
          <div className="rounded bg-emerald-500/20 px-4 py-2 font-mono text-emerald-300">
            🎉 Escape! {moves} moves
          </div>
          {stageIdx < STAGES.length - 1 && (
            <button
              onClick={() => changeStage(stageIdx + 1)}
              className="rounded bg-emerald-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-emerald-400"
            >
              Next Stage →
            </button>
          )}
        </div>
      )}

      <div
        className="relative bg-neutral-900 p-2"
        style={{ width: COLS * CELL + 16, height: ROWS * CELL + 16 }}
        onMouseUp={handleMouseUp}
      >
        <div
          className="absolute border-2 border-dashed border-emerald-400/50"
          style={{ left: 8 + 1 * CELL, top: 8 + 3 * CELL, width: 2 * CELL, height: 2 * CELL }}
        />
        {blocks.map((b) => (
          <div
            key={b.id}
            onMouseDown={(e) => handleMouseDown(e, b.id)}
            onClick={() => setSelected(b.id)}
            className={`absolute cursor-grab rounded transition ${selected === b.id ? 'ring-2 ring-amber-400' : ''}`}
            style={{
              left: 8 + b.c * CELL,
              top: 8 + b.r * CELL,
              width: b.w * CELL - 4,
              height: b.h * CELL - 4,
              background: b.color,
            }}
          >
            {b.isGoal && (
              <div className="flex h-full w-full items-center justify-center font-mono text-xs text-white">
                ★
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={() => reset()} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>

      <p className="max-w-md text-center font-mono text-xs text-neutral-500">
        Click a block to select → ↑↓←→ keys or drag to move. Slide the red ★ (2×2) into the dashed exit area!
      </p>
    </div>
  );
}
