'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import TouchControls from '@/components/TouchControls';

const STORAGE_KEY = 'highScore:sokoban';

const LEVELS = [
  [
    '#######',
    '#     #',
    '# $.  #',
    '# @   #',
    '#     #',
    '#######',
  ],
  [
    '########',
    '#      #',
    '#  ..  #',
    '#  $$  #',
    '#  @   #',
    '#      #',
    '########',
  ],
  [
    '##########',
    '#        #',
    '#  ...   #',
    '#  $$$   #',
    '#  @     #',
    '#        #',
    '##########',
  ],
];

type Tile = '#' | '.' | ' ';

interface ParsedLevel {
  walls: Tile[][];
  boxes: Set<string>;
  goals: Set<string>;
  player: { r: number; c: number };
  rows: number;
  cols: number;
}

function key(r: number, c: number) {
  return `${r},${c}`;
}

function parse(level: string[]): ParsedLevel {
  const walls: Tile[][] = [];
  const boxes = new Set<string>();
  const goals = new Set<string>();
  let player = { r: 0, c: 0 };
  level.forEach((line, r) => {
    const row: Tile[] = [];
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '#') row.push('#');
      else row.push(' ');
      if (ch === '.' || ch === '*') goals.add(key(r, c));
      if (ch === '$' || ch === '*') boxes.add(key(r, c));
      if (ch === '@') player = { r, c };
    }
    walls.push(row);
  });
  return { walls, boxes, goals, player, rows: walls.length, cols: Math.max(...walls.map((r) => r.length)) };
}

export default function GameSokoban() {
  const t = useTranslations('common');
  const [levelIdx, setLevelIdx] = useState(0);
  const [state, setState] = useState<ParsedLevel>(() => parse(LEVELS[0]));
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState<Record<number, number>>({});
  const [history, setHistory] = useState<{ boxes: Set<string>; player: { r: number; c: number } }[]>([]);

  const won = Array.from(state.goals).every((k) => state.boxes.has(k));

  const reset = useCallback(() => {
    setState(parse(LEVELS[levelIdx]));
    setMoves(0);
    setHistory([]);
  }, [levelIdx]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setBestMoves(JSON.parse(stored));
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (!won) return;
    const cur = bestMoves[levelIdx];
    if (cur === undefined || moves < cur) {
      const next = { ...bestMoves, [levelIdx]: moves };
      setBestMoves(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, [won, moves, bestMoves, levelIdx]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (won) return;
      let dr = 0, dc = 0;
      if (e.key === 'ArrowUp' || e.key === 'w') dr = -1;
      else if (e.key === 'ArrowDown' || e.key === 's') dr = 1;
      else if (e.key === 'ArrowLeft' || e.key === 'a') dc = -1;
      else if (e.key === 'ArrowRight' || e.key === 'd') dc = 1;
      else if (e.key === 'z' || e.key === 'Z') {
        if (history.length > 0) {
          const last = history[history.length - 1];
          setState((s) => ({ ...s, boxes: new Set(last.boxes), player: { ...last.player } }));
          setHistory((h) => h.slice(0, -1));
          setMoves((m) => Math.max(0, m - 1));
        }
        e.preventDefault();
        return;
      } else return;
      e.preventDefault();

      setState((s) => {
        const nr = s.player.r + dr;
        const nc = s.player.c + dc;
        if (s.walls[nr]?.[nc] === '#') return s;
        const nKey = key(nr, nc);
        if (s.boxes.has(nKey)) {
          const br = nr + dr;
          const bc = nc + dc;
          if (s.walls[br]?.[bc] === '#') return s;
          const bKey = key(br, bc);
          if (s.boxes.has(bKey)) return s;
          const newBoxes = new Set(s.boxes);
          newBoxes.delete(nKey);
          newBoxes.add(bKey);
          setHistory((h) => [...h, { boxes: new Set(s.boxes), player: { ...s.player } }]);
          setMoves((m) => m + 1);
          return { ...s, boxes: newBoxes, player: { r: nr, c: nc } };
        } else {
          setHistory((h) => [...h, { boxes: new Set(s.boxes), player: { ...s.player } }]);
          setMoves((m) => m + 1);
          return { ...s, player: { r: nr, c: nc } };
        }
      });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [won, history]);

  const cellSize = 36;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">Level {levelIdx + 1} · Moves: {moves}</span>
        <span className="text-neutral-400">
          Best: <span className="text-neutral-100">{bestMoves[levelIdx] ?? '—'}</span>
        </span>
      </div>

      {won && (
        <div className="rounded bg-emerald-500/20 px-4 py-2 font-mono text-emerald-300">
          🎉 Solved in {moves} moves!
        </div>
      )}

      <div
        className="grid bg-neutral-900 p-1"
        style={{ gridTemplateColumns: `repeat(${state.cols}, ${cellSize}px)` }}
      >
        {state.walls.map((row, r) =>
          Array.from({ length: state.cols }).map((_, c) => {
            const isWall = row[c] === '#';
            const k = key(r, c);
            const hasGoal = state.goals.has(k);
            const hasBox = state.boxes.has(k);
            const isPlayer = state.player.r === r && state.player.c === c;
            return (
              <div
                key={k}
                className={`flex h-9 w-9 items-center justify-center text-xl ${isWall ? 'bg-neutral-700' : hasGoal ? 'bg-emerald-900/40' : 'bg-neutral-800'}`}
              >
                {isPlayer ? '🙂' : hasBox ? (hasGoal ? '📦' : '🟫') : hasGoal ? '🎯' : ''}
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={reset} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
          {t('restart')}
        </button>
        {won && levelIdx < LEVELS.length - 1 && (
          <button
            onClick={() => { setLevelIdx(levelIdx + 1); }}
            className="rounded bg-emerald-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-emerald-400"
          >
            Next Level →
          </button>
        )}
        <button
          onClick={() => { setLevelIdx((levelIdx + 1) % LEVELS.length); }}
          className="rounded bg-neutral-700 px-3 py-2 font-mono text-xs text-neutral-100 hover:bg-neutral-600"
        >
          Skip
        </button>
      </div>

      <p className="font-mono text-xs text-neutral-500">↑↓←→/WASD: move · Z: undo</p>

      <TouchControls preset="dpad" />
    </div>
  );
}
