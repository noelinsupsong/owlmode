import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GAMES } from '@/lib/games';
import GameCard from '@/components/GameCard';
import AdBanner from '@/components/AdBanner';

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('site');
  const sortedGames = [...GAMES].sort((a, b) => b.popularity - a.popularity);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10 text-center">
        <h1 className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text font-pixel text-xl leading-relaxed tracking-tight text-transparent sm:text-3xl">
          {t('welcome')}
        </h1>
        <p className="mt-4 text-sm text-neutral-400 sm:text-base">
          {t('tagline')}
        </p>
      </section>

      <div className="mb-10">
        <AdBanner size="leaderboard" />
      </div>

      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {sortedGames.map((game) => (
            <GameCard key={game.slug} game={game} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
