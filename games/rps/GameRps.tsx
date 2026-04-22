'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'win' | 'lose' | 'draw' | null;

const CHOICES: readonly Choice[] = ['rock', 'paper', 'scissors'] as const;
const EMOJI: Record<Choice, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};

function judge(player: Choice, computer: Choice): Result {
  if (player === computer) return 'draw';
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) {
    return 'win';
  }
  return 'lose';
}

const STORAGE_KEY = 'highScore:rps';

export default function GameRps() {
  const t = useTranslations('common');
  const [player, setPlayer] = useState<Choice | null>(null);
  const [computer, setComputer] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [score, setScore] = useState({ win: 0, lose: 0, draw: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) setBestStreak(stored);
  }, []);

  function play(choice: Choice) {
    const cpu = CHOICES[Math.floor(Math.random() * 3)];
    const r = judge(choice, cpu);
    setPlayer(choice);
    setComputer(cpu);
    setResult(r);
    setScore((s) => ({
      win: s.win + (r === 'win' ? 1 : 0),
      lose: s.lose + (r === 'lose' ? 1 : 0),
      draw: s.draw + (r === 'draw' ? 1 : 0),
    }));
    if (r === 'win') {
      setStreak((prev) => {
        const next = prev + 1;
        if (next > bestStreak) {
          setBestStreak(next);
          localStorage.setItem(STORAGE_KEY, String(next));
        }
        return next;
      });
    } else if (r === 'lose') {
      setStreak(0);
    }
  }

  function reset() {
    setPlayer(null);
    setComputer(null);
    setResult(null);
    setScore({ win: 0, lose: 0, draw: 0 });
    setStreak(0);
  }

  const resultText =
    result === 'win'
      ? '🎉 Win!'
      : result === 'lose'
        ? '😢 Lose'
        : result === 'draw'
          ? '🤝 Draw'
          : '';

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="grid w-full grid-cols-3 gap-2 text-center font-mono text-sm">
        <div className="rounded bg-neutral-800 p-2">
          <div className="text-xs text-neutral-400">Win</div>
          <div className="text-lg text-emerald-400">{score.win}</div>
        </div>
        <div className="rounded bg-neutral-800 p-2">
          <div className="text-xs text-neutral-400">Lose</div>
          <div className="text-lg text-rose-400">{score.lose}</div>
        </div>
        <div className="rounded bg-neutral-800 p-2">
          <div className="text-xs text-neutral-400">Draw</div>
          <div className="text-lg text-neutral-300">{score.draw}</div>
        </div>
      </div>

      <div className="flex w-full items-center justify-around gap-4">
        <div className="flex flex-col items-center">
          <div className="text-xs text-neutral-400">YOU</div>
          <div className="text-6xl">{player ? EMOJI[player] : '❓'}</div>
        </div>
        <div className="text-2xl text-amber-400">VS</div>
        <div className="flex flex-col items-center">
          <div className="text-xs text-neutral-400">CPU</div>
          <div className="text-6xl">{computer ? EMOJI[computer] : '❓'}</div>
        </div>
      </div>

      {resultText && (
        <div className="font-mono text-xl font-bold text-amber-300">
          {resultText}
        </div>
      )}

      <div className="flex gap-3">
        {CHOICES.map((c) => (
          <button
            key={c}
            onClick={() => play(c)}
            className="rounded bg-neutral-800 px-5 py-3 text-3xl transition hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label={c}
          >
            {EMOJI[c]}
          </button>
        ))}
      </div>

      <div className="flex w-full justify-between font-mono text-xs text-neutral-400">
        <span>
          🔥 Streak: <span className="text-amber-300">{streak}</span>
        </span>
        <span>
          {t('highScore')}:{' '}
          <span className="text-neutral-100">{bestStreak}</span>
        </span>
        <button
          onClick={reset}
          className="text-neutral-400 underline hover:text-neutral-100"
        >
          {t('restart')}
        </button>
      </div>
    </div>
  );
}
