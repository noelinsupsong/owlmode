import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { GameMeta } from '@/lib/games';
import AdBanner from './AdBanner';
import GameControls from './GameControls';

export default async function GameLayout({
  game,
  locale,
  children,
}: {
  game: GameMeta;
  locale: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations();
  const name = t(`games.${game.slug}.name`);
  const desc = t(`games.${game.slug}.desc`);
  const genre = t(`genre.${game.genre}`);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <div className="mb-6">
        <Link
          href={`/${locale}`}
          className="font-mono text-sm text-neutral-400 hover:text-amber-400"
        >
          ← {t('common.back')}
        </Link>
      </div>

      <header className="mb-6 flex flex-col items-start gap-2">
        <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-300">
          {genre}
        </span>
        <h1 className="font-mono text-3xl font-bold tracking-tight text-neutral-100 sm:text-4xl">
          {name}
        </h1>
      </header>

      <div className="mb-6 rounded-xl border-l-4 border-amber-400 bg-amber-400/5 p-4 sm:p-5">
        <p className="text-base leading-relaxed text-neutral-100 sm:text-lg">
          {desc}
        </p>
      </div>

      <div className="game-stage rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl shadow-black/40 sm:p-10">
        {children}
      </div>

      <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-6">
        <GameControls slug={game.slug} locale={locale} />
      </section>

      <div className="mt-8">
        <AdBanner size="leaderboard" />
      </div>
    </div>
  );
}
