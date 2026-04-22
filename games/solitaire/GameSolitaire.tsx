'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const STORAGE_KEY = 'highScore:solitaire';

type Suit = '♠' | '♥' | '♦' | '♣';
const SUITS: readonly Suit[] = ['♠', '♥', '♦', '♣'] as const;

interface Card {
  suit: Suit;
  rank: number;
  faceUp: boolean;
  id: string;
}

type Source =
  | { type: 'tableau'; col: number; idx: number }
  | { type: 'waste' }
  | { type: 'foundation'; col: number };

interface State {
  tableau: Card[][];
  foundations: Card[][];
  stock: Card[];
  waste: Card[];
}

function isRed(s: Suit) {
  return s === '♥' || s === '♦';
}

function rankStr(r: number): string {
  if (r === 1) return 'A';
  if (r === 11) return 'J';
  if (r === 12) return 'Q';
  if (r === 13) return 'K';
  return String(r);
}

function newDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) {
    for (let r = 1; r <= 13; r++) {
      deck.push({ suit: s, rank: r, faceUp: false, id: `${s}${r}` });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function deal(): State {
  const deck = newDeck();
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let r = 0; r <= col; r++) {
      const card = deck[idx++];
      card.faceUp = r === col;
      tableau[col].push(card);
    }
  }
  return {
    tableau,
    foundations: [[], [], [], []],
    stock: deck.slice(idx),
    waste: [],
  };
}

function canStackOnTableau(card: Card, top: Card | undefined): boolean {
  if (!top) return card.rank === 13;
  if (!top.faceUp) return false;
  return isRed(card.suit) !== isRed(top.suit) && card.rank === top.rank - 1;
}

function canStackOnFoundation(card: Card, top: Card | undefined): boolean {
  if (!top) return card.rank === 1;
  return top.suit === card.suit && card.rank === top.rank + 1;
}

function cloneState(s: State): State {
  return {
    tableau: s.tableau.map((col) => col.map((c) => ({ ...c }))),
    foundations: s.foundations.map((col) => col.map((c) => ({ ...c }))),
    stock: s.stock.map((c) => ({ ...c })),
    waste: s.waste.map((c) => ({ ...c })),
  };
}

function isWon(s: State): boolean {
  return s.foundations.every((f) => f.length === 13);
}

function CardView({
  card,
  selected,
  onClick,
  onDoubleClick,
  offsetTop,
  zIndex,
}: {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  offsetTop?: number;
  zIndex?: number;
}) {
  const red = isRed(card.suit);
  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`absolute left-0 flex h-16 w-12 flex-col rounded border ${
        card.faceUp
          ? `bg-neutral-100 ${red ? 'text-rose-600' : 'text-neutral-900'} ${selected ? 'border-amber-400 ring-2 ring-amber-400' : 'border-neutral-400'}`
          : 'border-blue-700 bg-blue-600'
      }`}
      style={{ top: offsetTop ?? 0, zIndex: zIndex ?? 0 }}
    >
      {card.faceUp && (
        <div className="flex flex-col items-start px-1 font-mono text-[10px] leading-tight">
          <span className="font-bold">{rankStr(card.rank)}</span>
          <span>{card.suit}</span>
        </div>
      )}
    </button>
  );
}

export default function GameSolitaire() {
  const t = useTranslations('common');
  const [state, setState] = useState<State>(deal);
  const [selection, setSelection] = useState<Source | null>(null);
  const [moves, setMoves] = useState(0);
  const [history, setHistory] = useState<State[]>([]);
  const [bestMoves, setBestMoves] = useState<number | null>(null);

  const won = isWon(state);

  const reset = useCallback(() => {
    setState(deal());
    setSelection(null);
    setMoves(0);
    setHistory([]);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setBestMoves(Number(stored));
  }, []);

  useEffect(() => {
    if (!won) return;
    if (bestMoves === null || moves < bestMoves) {
      setBestMoves(moves);
      localStorage.setItem(STORAGE_KEY, String(moves));
    }
  }, [won, moves, bestMoves]);

  const commit = useCallback((next: State) => {
    setHistory((h) => [...h.slice(-49), state]);
    setState(next);
    setMoves((m) => m + 1);
    setSelection(null);
  }, [state]);

  function getSelectedCards(src: Source): Card[] | null {
    if (src.type === 'waste') {
      const c = state.waste[state.waste.length - 1];
      return c ? [c] : null;
    }
    if (src.type === 'foundation') {
      const c = state.foundations[src.col][state.foundations[src.col].length - 1];
      return c ? [c] : null;
    }
    const col = state.tableau[src.col];
    if (src.idx < 0 || src.idx >= col.length) return null;
    if (!col[src.idx].faceUp) return null;
    return col.slice(src.idx);
  }

  function removeFromSource(s: State, src: Source): void {
    if (src.type === 'waste') {
      s.waste.pop();
    } else if (src.type === 'foundation') {
      s.foundations[src.col].pop();
    } else {
      s.tableau[src.col] = s.tableau[src.col].slice(0, src.idx);
      const col = s.tableau[src.col];
      if (col.length > 0 && !col[col.length - 1].faceUp) {
        col[col.length - 1] = { ...col[col.length - 1], faceUp: true };
      }
    }
  }

  function tryMoveToTableau(src: Source, destCol: number) {
    const cards = getSelectedCards(src);
    if (!cards || cards.length === 0) return;
    if (src.type === 'tableau' && src.col === destCol) return;
    const dest = state.tableau[destCol];
    if (!canStackOnTableau(cards[0], dest[dest.length - 1])) return;
    const next = cloneState(state);
    removeFromSource(next, src);
    next.tableau[destCol].push(...cards.map((c) => ({ ...c })));
    commit(next);
  }

  function tryMoveToFoundation(src: Source, destCol: number) {
    const cards = getSelectedCards(src);
    if (!cards || cards.length !== 1) return;
    const dest = state.foundations[destCol];
    if (!canStackOnFoundation(cards[0], dest[dest.length - 1])) return;
    const next = cloneState(state);
    removeFromSource(next, src);
    next.foundations[destCol].push({ ...cards[0] });
    commit(next);
  }

  function autoToFoundation(src: Source) {
    const cards = getSelectedCards(src);
    if (!cards || cards.length !== 1) return;
    const card = cards[0];
    for (let i = 0; i < 4; i++) {
      const top = state.foundations[i][state.foundations[i].length - 1];
      if (canStackOnFoundation(card, top)) {
        tryMoveToFoundation(src, i);
        return;
      }
    }
  }

  function clickCard(src: Source) {
    if (selection === null) {
      const cards = getSelectedCards(src);
      if (!cards || cards.length === 0) return;
      setSelection(src);
      return;
    }
    if (sourceEquals(selection, src)) {
      setSelection(null);
      return;
    }
    if (src.type === 'tableau') {
      tryMoveToTableau(selection, src.col);
    } else if (src.type === 'foundation') {
      tryMoveToFoundation(selection, src.col);
    }
  }

  function clickEmptyTableau(col: number) {
    if (selection === null) return;
    tryMoveToTableau(selection, col);
  }

  function clickEmptyFoundation(col: number) {
    if (selection === null) return;
    tryMoveToFoundation(selection, col);
  }

  function clickStock() {
    setSelection(null);
    if (state.stock.length === 0) {
      const next = cloneState(state);
      next.stock = next.waste.reverse().map((c) => ({ ...c, faceUp: false }));
      next.waste = [];
      commit(next);
      return;
    }
    const next = cloneState(state);
    const card = next.stock.pop()!;
    card.faceUp = true;
    next.waste.push(card);
    commit(next);
  }

  function undo() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setState(last);
    setMoves((m) => Math.max(0, m - 1));
    setSelection(null);
  }

  function sourceEquals(a: Source, b: Source): boolean {
    if (a.type !== b.type) return false;
    if (a.type === 'waste') return true;
    if (a.type === 'foundation' && b.type === 'foundation') return a.col === b.col;
    if (a.type === 'tableau' && b.type === 'tableau') return a.col === b.col && a.idx === b.idx;
    return false;
  }

  function isSelected(src: Source): boolean {
    if (!selection) return false;
    if (selection.type !== src.type) return false;
    if (selection.type === 'waste') return src.type === 'waste';
    if (selection.type === 'foundation' && src.type === 'foundation')
      return selection.col === src.col;
    if (selection.type === 'tableau' && src.type === 'tableau')
      return selection.col === src.col && src.idx >= selection.idx;
    return false;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">Moves: {moves}</span>
        <span className="text-neutral-400">
          Best: <span className="text-neutral-100">{bestMoves ?? '—'}</span>
        </span>
      </div>

      {won && (
        <div className="rounded bg-emerald-500/20 px-4 py-2 font-mono text-emerald-300">
          🎉 Solved in {moves} moves!
        </div>
      )}

      <div className="rounded-lg bg-emerald-900/40 p-3">
        <div className="mb-3 flex justify-between gap-2">
          <div className="flex gap-2">
            <div
              onClick={clickStock}
              className={`flex h-16 w-12 cursor-pointer items-center justify-center rounded border-2 border-dashed border-neutral-500 ${state.stock.length > 0 ? 'border-blue-700 bg-blue-600' : 'bg-neutral-900/50'}`}
            >
              {state.stock.length > 0 ? (
                <span className="font-mono text-xs text-blue-100">{state.stock.length}</span>
              ) : (
                <span className="font-mono text-xs text-neutral-500">↻</span>
              )}
            </div>
            <div className="relative flex h-16 w-12 items-center justify-center rounded border-2 border-dashed border-neutral-500">
              {state.waste.length > 0 && (
                <CardView
                  card={state.waste[state.waste.length - 1]}
                  selected={isSelected({ type: 'waste' })}
                  onClick={() => clickCard({ type: 'waste' })}
                  onDoubleClick={() => autoToFoundation({ type: 'waste' })}
                />
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {state.foundations.map((f, i) => (
              <div
                key={i}
                onClick={() => clickEmptyFoundation(i)}
                className="relative flex h-16 w-12 items-center justify-center rounded border-2 border-dashed border-neutral-500"
              >
                {f.length === 0 ? (
                  <span className="font-mono text-xl text-neutral-600">{SUITS[i]}</span>
                ) : (
                  <CardView
                    card={f[f.length - 1]}
                    selected={isSelected({ type: 'foundation', col: i })}
                    onClick={() => clickCard({ type: 'foundation', col: i })}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {state.tableau.map((col, ci) => (
            <div
              key={ci}
              className="relative w-12"
              style={{ height: Math.max(64, 64 + (col.length - 1) * 18) }}
            >
              {col.length === 0 ? (
                <div
                  onClick={() => clickEmptyTableau(ci)}
                  className="absolute left-0 top-0 h-16 w-12 cursor-pointer rounded border-2 border-dashed border-neutral-500"
                />
              ) : (
                col.map((card, ri) => (
                  <CardView
                    key={card.id}
                    card={card}
                    selected={isSelected({ type: 'tableau', col: ci, idx: ri })}
                    onClick={() => clickCard({ type: 'tableau', col: ci, idx: ri })}
                    onDoubleClick={() =>
                      ri === col.length - 1 &&
                      autoToFoundation({ type: 'tableau', col: ci, idx: ri })
                    }
                    offsetTop={ri * 18}
                    zIndex={ri}
                  />
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="rounded bg-neutral-700 px-3 py-2 font-mono text-xs text-neutral-100 hover:bg-neutral-600 disabled:opacity-30"
        >
          ↶ Undo
        </button>
        <button
          onClick={reset}
          className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400"
        >
          {t('restart')}
        </button>
      </div>

      <p className="max-w-md text-center font-mono text-xs text-neutral-500">
        Klondike Solitaire — click a card to select, click target to move. Double-click auto-sends to foundation. Empty tableau accepts K only; foundation = same suit A→K; tableau alternates colors K→A.
      </p>
    </div>
  );
}
