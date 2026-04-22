'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const HOLES = 9;
const ROUND_MS = 30_000;
const STORAGE_KEY = 'highScore:whack-a-mole';

export default function GameWhackAMole() {
  const t = useTranslations('common');
  const [active, setActive] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_MS);
  const [running, setRunning] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const moleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
  }, []);

  const popMole = useCallback(() => {
    setActive((prev) => {
      let next: number;
      do {
        next = Math.floor(Math.random() * HOLES);
      } while (next === prev);
      return next;
    });
    const lifespan = 600 + Math.random() * 700;
    const nextDelay = 200 + Math.random() * 400;
    if (moleTimer.current) clearTimeout(moleTimer.current);
    moleTimer.current = setTimeout(() => {
      setActive(null);
      moleTimer.current = setTimeout(popMole, nextDelay);
    }, lifespan);
  }, []);

  const start = useCallback(() => {
    setScore(0);
    setTimeLeft(ROUND_MS);
    setRunning(true);
    popMole();
    if (tickTimer.current) clearInterval(tickTimer.current);
    tickTimer.current = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 100;
        if (next <= 0) {
          if (tickTimer.current) clearInterval(tickTimer.current);
          if (moleTimer.current) clearTimeout(moleTimer.current);
          tickTimer.current = null;
          moleTimer.current = null;
          setActive(null);
          setRunning(false);
          setScore((s) => {
            setHighScore((h) => {
              if (s > h) {
                localStorage.setItem(STORAGE_KEY, String(s));
                return s;
              }
              return h;
            });
            return s;
          });
          return 0;
        }
        return next;
      });
    }, 100);
  }, [popMole]);

  useEffect(() => {
    return () => {
      if (moleTimer.current) clearTimeout(moleTimer.current);
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
  }, []);

  function whack(idx: number) {
    if (!running) return;
    if (idx === active) {
      setScore((s) => s + 1);
      setActive(null);
    } else {
      setScore((s) => Math.max(0, s - 1));
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full justify-between font-mono text-sm">
        <span className="text-amber-300">
          {t('score')}: {score}
        </span>
        <span className="text-neutral-300">
          ⏱ {(timeLeft / 1000).toFixed(1)}s
        </span>
        <span className="text-neutral-400">
          {t('highScore')}:{' '}
          <span className="text-neutral-100">{highScore}</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: HOLES }).map((_, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              onClick={() => whack(i)}
              disabled={!running}
              className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl transition sm:h-24 sm:w-24 ${
                isActive
                  ? 'bg-amber-500 text-neutral-900 shadow-lg shadow-amber-500/40'
                  : 'bg-neutral-800 text-neutral-700'
              }`}
              aria-label={`Hole ${i + 1}`}
            >
              {isActive ? '🐹' : '🕳️'}
            </button>
          );
        })}
      </div>

      {!running && (
        <button
          onClick={start}
          className="rounded bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-neutral-900 hover:bg-amber-400"
        >
          {timeLeft === 0 || score > 0 ? t('restart') : t('start')}
        </button>
      )}
    </div>
  );
}
