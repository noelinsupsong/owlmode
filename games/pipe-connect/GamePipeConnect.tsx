'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const SIZE = 5;
const STORAGE_KEY = 'highScore:pipe-connect';

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#a855f7'];

interface Endpoint {
  r: number;
  c: number;
  color: number;
}

interface Stage {
  name: string;
  description: string;
  endpoints: Endpoint[];
}

const STAGES: Stage[] = [
  {
    name: 'Stage 1 · Lines',
    description: 'Easy — 5 colors in horizontal lines',
    endpoints: [
      { r: 0, c: 0, color: 0 }, { r: 0, c: 4, color: 0 },
      { r: 1, c: 0, color: 1 }, { r: 1, c: 4, color: 1 },
      { r: 2, c: 0, color: 2 }, { r: 2, c: 4, color: 2 },
      { r: 3, c: 0, color: 3 }, { r: 3, c: 4, color: 3 },
      { r: 4, c: 0, color: 4 }, { r: 4, c: 4, color: 4 },
    ],
  },
  {
    name: 'Stage 2 · Twist',
    description: 'Medium — L-shaped paths required',
    endpoints: [
      { r: 0, c: 0, color: 0 }, { r: 4, c: 0, color: 0 },
      { r: 2, c: 1, color: 1 }, { r: 4, c: 4, color: 1 },
      { r: 0, c: 2, color: 2 }, { r: 3, c: 4, color: 2 },
      { r: 0, c: 1, color: 3 }, { r: 1, c: 3, color: 3 },
      { r: 2, c: 3, color: 4 }, { r: 3, c: 3, color: 4 },
    ],
  },
  {
    name: 'Stage 3 · Maze',
    description: 'Hard — complex winding paths',
    endpoints: [
      { r: 0, c: 0, color: 0 }, { r: 3, c: 1, color: 0 },
      { r: 1, c: 0, color: 1 }, { r: 4, c: 1, color: 1 },
      { r: 0, c: 4, color: 2 }, { r: 2, c: 3, color: 2 },
      { r: 0, c: 2, color: 3 }, { r: 4, c: 4, color: 3 },
      { r: 1, c: 4, color: 4 }, { r: 3, c: 3, color: 4 },
    ],
  },
];

export default function GamePipeConnect() {
  const t = useTranslations('common');
  const [stageIdx, setStageIdx] = useState(0);
  const [paths, setPaths] = useState<Record<number, [number, number][]>>({});
  const [drawing, setDrawing] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState<Record<number, number>>({});

  const stage = STAGES[stageIdx];

  const grid: (number | null)[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  for (const ep of stage.endpoints) grid[ep.r][ep.c] = ep.color;
  for (const [colorStr, path] of Object.entries(paths)) {
    const color = Number(colorStr);
    for (const [r, c] of path) grid[r][c] = color;
  }

  const isEndpoint = (r: number, c: number, color?: number) =>
    stage.endpoints.some((e) => e.r === r && e.c === c && (color === undefined || e.color === color));

  const allConnected = stage.endpoints.every((ep, i, arr) => {
    const pair = arr.find((o, j) => o.color === ep.color && j > i);
    if (!pair) return true;
    const path = paths[ep.color] ?? [];
    if (path.length < 2) return false;
    const start = path[0];
    const end = path[path.length - 1];
    const matches =
      (start[0] === ep.r && start[1] === ep.c && end[0] === pair.r && end[1] === pair.c) ||
      (start[0] === pair.r && start[1] === pair.c && end[0] === ep.r && end[1] === ep.c);
    return matches;
  });
  const allFilled = grid.every((row) => row.every((cell) => cell !== null));
  const won = allConnected && allFilled;

  const reset = useCallback(() => {
    setPaths({});
    setDrawing(null);
    setMoves(0);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) setBestMoves(parsed);
      } catch {
        // ignore
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
    setPaths({});
    setDrawing(null);
    setMoves(0);
  }

  function startDraw(r: number, c: number) {
    const ep = stage.endpoints.find((e) => e.r === r && e.c === c);
    if (!ep) {
      for (const [colorStr, path] of Object.entries(paths)) {
        if (path.some(([pr, pc]) => pr === r && pc === c)) {
          const color = Number(colorStr);
          const idx = path.findIndex(([pr, pc]) => pr === r && pc === c);
          setPaths({ ...paths, [color]: path.slice(0, idx + 1) });
          setDrawing(color);
          return;
        }
      }
      return;
    }
    setPaths({ ...paths, [ep.color]: [[r, c]] });
    setDrawing(ep.color);
  }

  function continueDraw(r: number, c: number) {
    if (drawing === null) return;
    const cur = paths[drawing] ?? [];
    if (cur.length === 0) return;
    const last = cur[cur.length - 1];
    const dr = Math.abs(last[0] - r);
    const dc = Math.abs(last[1] - c);
    if (dr + dc !== 1) return;
    if (cur.some(([pr, pc]) => pr === r && pc === c)) return;
    if (isEndpoint(r, c) && !isEndpoint(r, c, drawing)) return;
    for (const [colorStr, path] of Object.entries(paths)) {
      if (Number(colorStr) === drawing) continue;
      if (path.some(([pr, pc]) => pr === r && pc === c)) {
        const color = Number(colorStr);
        const idx = path.findIndex(([pr, pc]) => pr === r && pc === c);
        const newPaths = { ...paths };
        newPaths[color] = path.slice(0, idx);
        newPaths[drawing] = [...cur, [r, c]];
        setPaths(newPaths);
        return;
      }
    }
    setPaths({ ...paths, [drawing]: [...cur, [r, c]] });
  }

  function endDraw() {
    if (drawing !== null) setMoves((m) => m + 1);
    setDrawing(null);
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
        <span className="text-neutral-400">Stage:</span>
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
            🎉 Solved in {moves} moves!
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
        className="grid select-none rounded bg-neutral-900 p-2"
        style={{ gridTemplateColumns: `repeat(${SIZE}, 56px)`, gap: 4 }}
        onMouseLeave={endDraw}
        onMouseUp={endDraw}
      >
        {Array.from({ length: SIZE }).map((_, r) =>
          Array.from({ length: SIZE }).map((_, c) => {
            const v = grid[r][c];
            const ep = stage.endpoints.find((e) => e.r === r && e.c === c);
            const bg = v === null ? '#1f2937' : COLORS[v] + '40';
            return (
              <button
                key={`${r}-${c}`}
                onMouseDown={() => startDraw(r, c)}
                onMouseEnter={() => continueDraw(r, c)}
                className="flex h-14 w-14 items-center justify-center rounded text-2xl"
                style={{ background: bg }}
              >
                {ep && (
                  <div className="h-8 w-8 rounded-full" style={{ background: COLORS[ep.color] }} />
                )}
              </button>
            );
          })
        )}
      </div>

      <button onClick={reset} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>

      <p className="max-w-md text-center font-mono text-xs text-neutral-500">
        Drag to connect matching color dots. Connect all colors and fill every cell to win!
      </p>
    </div>
  );
}
