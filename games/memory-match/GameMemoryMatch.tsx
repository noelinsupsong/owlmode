'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const SYMBOLS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐯', '🦁'] as const;
const STORAGE_KEY = 'highScore:memory-match';
const PREVIEW_MS = 3000;

interface Card {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

function buildDeck(reveal: boolean): Card[] {
  return [...SYMBOLS, ...SYMBOLS]
    .map((symbol, i) => ({ id: i, symbol, flipped: reveal, matched: false }))
    .sort(() => Math.random() - 0.5);
}

export default function GameMemoryMatch() {
  const t = useTranslations('common');
  const [cards, setCards] = useState<Card[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [first, setFirst] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [previewLeft, setPreviewLeft] = useState(0);
  const previewTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPreview = useCallback(() => {
    if (previewTimer.current) clearInterval(previewTimer.current);
    setCards(buildDeck(true));
    setMoves(0);
    setMatched(0);
    setFirst(null);
    setBusy(true);
    setPreviewLeft(PREVIEW_MS);

    const startedAt = Date.now();
    previewTimer.current = setInterval(() => {
      const remaining = PREVIEW_MS - (Date.now() - startedAt);
      if (remaining <= 0) {
        if (previewTimer.current) clearInterval(previewTimer.current);
        previewTimer.current = null;
        setPreviewLeft(0);
        setCards((cs) => cs.map((c) => ({ ...c, flipped: false })));
        setBusy(false);
      } else {
        setPreviewLeft(remaining);
      }
    }, 100);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setBestMoves(Number(stored));
    startPreview();
    return () => {
      if (previewTimer.current) clearInterval(previewTimer.current);
    };
  }, [startPreview]);

  const won = matched === SYMBOLS.length;

  useEffect(() => {
    if (!won) return;
    if (bestMoves === null || moves < bestMoves) {
      setBestMoves(moves);
      localStorage.setItem(STORAGE_KEY, String(moves));
    }
  }, [won, moves, bestMoves]);

  function flip(idx: number) {
    if (busy) return;
    const card = cards[idx];
    if (card.flipped || card.matched) return;

    const next = cards.slice();
    next[idx] = { ...card, flipped: true };
    setCards(next);

    if (first === null) {
      setFirst(idx);
      return;
    }

    setMoves((m) => m + 1);
    setBusy(true);
    const a = next[first];
    const b = next[idx];
    if (a.symbol === b.symbol) {
      setTimeout(() => {
        setCards((cs) => {
          const updated = cs.slice();
          updated[first] = { ...updated[first], matched: true };
          updated[idx] = { ...updated[idx], matched: true };
          return updated;
        });
        setMatched((n) => n + 1);
        setFirst(null);
        setBusy(false);
      }, 350);
    } else {
      setTimeout(() => {
        setCards((cs) => {
          const updated = cs.slice();
          updated[first] = { ...updated[first], flipped: false };
          updated[idx] = { ...updated[idx], flipped: false };
          return updated;
        });
        setFirst(null);
        setBusy(false);
      }, 800);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">Moves: {moves}</span>
        <span className="text-neutral-400">
          {t('highScore')}:{' '}
          <span className="text-neutral-100">{bestMoves ?? '—'}</span>
        </span>
      </div>

      {previewLeft > 0 && (
        <div className="rounded bg-sky-500/20 px-4 py-2 font-mono text-sky-300">
          👀 Memorize! {(previewLeft / 1000).toFixed(1)}s
        </div>
      )}

      {won && (
        <div className="rounded bg-amber-500/20 px-4 py-2 font-mono text-amber-300">
          🎉 Cleared in {moves} moves!
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => flip(i)}
            disabled={card.matched || busy}
            className={`flex h-16 w-16 items-center justify-center rounded text-3xl transition sm:h-20 sm:w-20 ${
              card.flipped || card.matched
                ? card.matched
                  ? 'bg-emerald-500/20'
                  : 'bg-neutral-700'
                : 'bg-amber-500 hover:bg-amber-400'
            }`}
            aria-label={`Card ${i + 1}`}
          >
            {card.flipped || card.matched ? card.symbol : ''}
          </button>
        ))}
      </div>

      <button
        onClick={startPreview}
        className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400"
      >
        {t('restart')}
      </button>
    </div>
  );
}
