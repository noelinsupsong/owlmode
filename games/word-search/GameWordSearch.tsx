'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const SIZE = 10;
const STORAGE_KEY = 'highScore:word-search';

const WORD_BANK = [
  ['SNAKE', 'PIXEL', 'RETRO', 'ARCADE', 'GAMES', 'BLOCK'],
  ['JEWEL', 'PUZZLE', 'BOARD', 'MOUSE', 'POINT', 'LEVEL'],
  ['SCORE', 'SPACE', 'PLAYER', 'CLICK', 'MOVE', 'PIPE'],
];

const DIRS: [number, number][] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
];

interface Placement {
  word: string;
  cells: [number, number][];
}

function tryPlace(grid: string[][], word: string): Placement | null {
  for (let attempt = 0; attempt < 100; attempt++) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
    const cells: [number, number][] = [];
    let ok = true;
    for (let i = 0; i < word.length; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (nr < 0 || nc < 0 || nr >= SIZE || nc >= SIZE) {
        ok = false;
        break;
      }
      if (grid[nr][nc] !== '' && grid[nr][nc] !== word[i]) {
        ok = false;
        break;
      }
      cells.push([nr, nc]);
    }
    if (ok) {
      for (let i = 0; i < word.length; i++) {
        const [nr, nc] = cells[i];
        grid[nr][nc] = word[i];
      }
      return { word, cells };
    }
  }
  return null;
}

function buildPuzzle(words: string[]): { grid: string[][]; placements: Placement[] } {
  const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
  const placements: Placement[] = [];
  for (const word of words) {
    const p = tryPlace(grid, word);
    if (p) placements.push(p);
  }
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }
  return { grid, placements };
}

export default function GameWordSearch() {
  const t = useTranslations('common');
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [grid, setGrid] = useState<string[][]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [dragStart, setDragStart] = useState<[number, number] | null>(null);
  const [dragEnd, setDragEnd] = useState<[number, number] | null>(null);
  const [bestTime, setBestTime] = useState<Record<number, number>>({});
  const [time, setTime] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const reset = useCallback((idx: number = puzzleIdx) => {
    const w = WORD_BANK[idx];
    const { grid: g, placements: p } = buildPuzzle(w);
    setWords(w);
    setGrid(g);
    setPlacements(p);
    setFound([]);
    setDragStart(null);
    setDragEnd(null);
    setStartedAt(Date.now());
    setTime(0);
  }, [puzzleIdx]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) setBestTime(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  const won = placements.length > 0 && found.length === placements.length;

  useEffect(() => {
    if (!won || !startedAt) return;
    const elapsed = (Date.now() - startedAt) / 1000;
    setTime(elapsed);
    const cur = bestTime[puzzleIdx];
    if (cur === undefined || elapsed < cur) {
      const next = { ...bestTime, [puzzleIdx]: elapsed };
      setBestTime(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, [won, startedAt, bestTime, puzzleIdx]);

  useEffect(() => {
    if (won || !startedAt) return;
    const id = setInterval(() => setTime((Date.now() - startedAt) / 1000), 200);
    return () => clearInterval(id);
  }, [won, startedAt]);

  function changePuzzle(idx: number) {
    setPuzzleIdx(idx);
    reset(idx);
  }

  function getDragCells(): [number, number][] {
    if (!dragStart || !dragEnd) return [];
    const [sr, sc] = dragStart;
    const [er, ec] = dragEnd;
    const dr = er - sr;
    const dc = ec - sc;
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    if (len === 0) return [[sr, sc]];
    const stepR = dr === 0 ? 0 : Math.sign(dr);
    const stepC = dc === 0 ? 0 : Math.sign(dc);
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return [[sr, sc]];
    const cells: [number, number][] = [];
    for (let i = 0; i <= len; i++) {
      cells.push([sr + stepR * i, sc + stepC * i]);
    }
    return cells;
  }

  function endDrag() {
    if (!dragStart || !dragEnd) {
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    const cells = getDragCells();
    const word = cells.map(([r, c]) => grid[r][c]).join('');
    const reversed = word.split('').reverse().join('');
    const matched = words.find((w) => (w === word || w === reversed) && !found.includes(w));
    if (matched) setFound([...found, matched]);
    setDragStart(null);
    setDragEnd(null);
  }

  const dragCells = getDragCells();
  const foundCells = new Set<string>();
  for (const p of placements) {
    if (found.includes(p.word)) {
      for (const [r, c] of p.cells) foundCells.add(`${r},${c}`);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">⏱ {time.toFixed(1)}s</span>
        <span className="text-sky-300">{found.length} / {placements.length}</span>
        <span className="text-neutral-400">Best: <span className="text-neutral-100">{bestTime[puzzleIdx] ? `${bestTime[puzzleIdx].toFixed(1)}s` : '—'}</span></span>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="text-neutral-400">Puzzle:</span>
        {WORD_BANK.map((_, i) => (
          <button
            key={i}
            onClick={() => changePuzzle(i)}
            className={`rounded px-3 py-1 ${puzzleIdx === i ? 'bg-amber-500 text-neutral-900' : 'bg-neutral-800 text-neutral-300'}`}
          >
            {i + 1}
            {bestTime[i] !== undefined && ' ✓'}
          </button>
        ))}
      </div>

      {won && (
        <div className="rounded bg-emerald-500/20 px-4 py-2 font-mono text-emerald-300">
          🎉 Cleared in {time.toFixed(1)}s!
        </div>
      )}

      <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start">
        <div className="grid select-none rounded bg-neutral-900 p-2" style={{ gridTemplateColumns: `repeat(${SIZE}, 32px)`, gap: 2 }}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
        >
          {grid.map((row, r) =>
            row.map((ch, c) => {
              const isDrag = dragCells.some(([dr, dc]) => dr === r && dc === c);
              const isFound = foundCells.has(`${r},${c}`);
              return (
                <button
                  key={`${r}-${c}`}
                  onMouseDown={() => { setDragStart([r, c]); setDragEnd([r, c]); }}
                  onMouseEnter={() => { if (dragStart) setDragEnd([r, c]); }}
                  className={`flex h-8 w-8 items-center justify-center rounded font-mono text-sm font-bold ${
                    isFound ? 'bg-emerald-500/30 text-emerald-200' : isDrag ? 'bg-amber-500/40 text-amber-100' : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {ch}
                </button>
              );
            })
          )}
        </div>

        <div className="rounded bg-neutral-900 p-3 font-mono text-sm">
          <div className="mb-2 text-xs uppercase tracking-wider text-amber-300">Words</div>
          {words.map((w) => (
            <div key={w} className={found.includes(w) ? 'text-neutral-500 line-through' : 'text-neutral-100'}>
              {w}
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => reset()} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>

      <p className="max-w-md text-center font-mono text-xs text-neutral-500">
        Press the first letter, drag (horizontal/vertical/diagonal) to the last letter, release. Find all words to win!
      </p>
    </div>
  );
}
