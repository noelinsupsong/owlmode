'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const STORAGE_KEY = 'highScore:mahjong-solitaire';
const SYMBOLS = ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀐', '🀑', '🀒', '🀓'] as const;

interface Tile {
  id: number;
  symbol: string;
  r: number;
  c: number;
  removed: boolean;
}

const ROWS = 6;
const COLS = 8;

function buildBoard(): Tile[] {
  const layout: [number, number][] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if ((r === 0 || r === ROWS - 1) && (c < 1 || c > COLS - 2)) continue;
      if ((r === 1 || r === ROWS - 2) && (c < 0 || c > COLS - 1)) {
        // include all
      }
      layout.push([r, c]);
    }
  }
  const positions = layout.slice(0, Math.floor(layout.length / 2) * 2);
  const symbols: string[] = [];
  for (let i = 0; i < positions.length / 2; i++) {
    const sym = SYMBOLS[i % SYMBOLS.length];
    symbols.push(sym, sym);
  }
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  return positions.map(([r, c], i) => ({
    id: i,
    symbol: symbols[i],
    r,
    c,
    removed: false,
  }));
}

function isFree(tile: Tile, tiles: Tile[]): boolean {
  if (tile.removed) return false;
  const left = tiles.find((t) => !t.removed && t.r === tile.r && t.c === tile.c - 1);
  const right = tiles.find((t) => !t.removed && t.r === tile.r && t.c === tile.c + 1);
  return !left || !right;
}

export default function GameMahjongSolitaire() {
  const t = useTranslations('common');
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState<number | null>(null);

  const reset = useCallback(() => {
    setTiles(buildBoard());
    setSelected(null);
    setMoves(0);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setBestMoves(Number(stored));
    setTiles(buildBoard());
  }, []);

  const remaining = tiles.filter((tt) => !tt.removed).length;
  const won = tiles.length > 0 && remaining === 0;

  useEffect(() => {
    if (!won) return;
    if (bestMoves === null || moves < bestMoves) {
      setBestMoves(moves);
      localStorage.setItem(STORAGE_KEY, String(moves));
    }
  }, [won, moves, bestMoves]);

  function click(tile: Tile) {
    if (tile.removed) return;
    if (!isFree(tile, tiles)) return;
    if (selected === null) {
      setSelected(tile.id);
      return;
    }
    if (selected === tile.id) {
      setSelected(null);
      return;
    }
    const a = tiles.find((tt) => tt.id === selected);
    const b = tile;
    if (!a) {
      setSelected(tile.id);
      return;
    }
    if (a.symbol === b.symbol) {
      setTiles(tiles.map((tt) => (tt.id === a.id || tt.id === b.id ? { ...tt, removed: true } : tt)));
      setSelected(null);
      setMoves((m) => m + 1);
    } else {
      setSelected(tile.id);
    }
  }

  const cell = 44;
  const maxR = Math.max(...tiles.map((tt) => tt.r), ROWS - 1);
  const maxC = Math.max(...tiles.map((tt) => tt.c), COLS - 1);

  const isStuck = !won && tiles.filter((tt) => !tt.removed && isFree(tt, tiles)).length > 0 &&
    !hasMatch(tiles);

  function hasMatch(list: Tile[]): boolean {
    const free = list.filter((tt) => !tt.removed && isFree(tt, list));
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        if (free[i].symbol === free[j].symbol) return true;
      }
    }
    return false;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">Tiles left: {remaining}</span>
        <span className="text-sky-300">Moves: {moves}</span>
        <span className="text-neutral-400">Best: <span className="text-neutral-100">{bestMoves ?? '—'}</span></span>
      </div>

      {won && (
        <div className="rounded bg-emerald-500/20 px-4 py-2 font-mono text-emerald-300">
          🎉 Cleared! {moves} moves
        </div>
      )}
      {isStuck && (
        <div className="rounded bg-rose-500/20 px-4 py-2 font-mono text-rose-300">
          🚫 No matching pairs available. Restart!
        </div>
      )}

      <div className="relative bg-emerald-900/20 p-2" style={{ width: (maxC + 1) * cell + 16, height: (maxR + 1) * cell + 16 }}>
        {tiles.map((tile) => {
          if (tile.removed) return null;
          const free = isFree(tile, tiles);
          return (
            <button
              key={tile.id}
              onClick={() => click(tile)}
              className={`absolute flex items-center justify-center rounded text-2xl transition ${
                selected === tile.id
                  ? 'bg-amber-400 text-neutral-900 ring-2 ring-amber-200'
                  : free
                    ? 'bg-amber-100 text-neutral-900 hover:bg-amber-200'
                    : 'bg-neutral-700 text-neutral-500'
              }`}
              style={{
                left: 8 + tile.c * cell,
                top: 8 + tile.r * cell,
                width: cell - 4,
                height: cell - 4,
              }}
              disabled={!free}
            >
              {tile.symbol}
            </button>
          );
        })}
      </div>

      <button onClick={reset} className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400">
        {t('restart')}
      </button>

      <p className="max-w-md text-center font-mono text-xs text-neutral-500">
        Click two tiles with the same symbol to remove them. Only tiles with a free left or right side are selectable. Clear the board to win!
      </p>
    </div>
  );
}
