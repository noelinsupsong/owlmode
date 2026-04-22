import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GAMES, type GameGenre, type GameMeta } from '@/lib/games';
import GameCard from '@/components/GameCard';
import AdBanner from '@/components/AdBanner';

const CATEGORY_ORDER: GameGenre[] = [
  'arcade',
  'puzzle',
  'action',
  'shooter',
  'board',
  'memory',
  'casual',
  'card',
  'block',
];

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();

  const grouped: Partial<Record<GameGenre, GameMeta[]>> = {};
  for (const g of GAMES) {
    if (!grouped[g.genre]) grouped[g.genre] = [];
    grouped[g.genre]!.push(g);
  }
  for (const genre of Object.keys(grouped) as GameGenre[]) {
    grouped[genre]!.sort((a, b) => b.popularity - a.popularity);
  }

  const sections = CATEGORY_ORDER.map((genre) => ({
    genre,
    games: grouped[genre] ?? [],
  })).filter((s) => s.games.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10 text-center">
        <h1 className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text font-pixel text-xl leading-relaxed tracking-tight text-transparent sm:text-3xl">
          {t('site.welcome')}
        </h1>
        <p className="mt-4 text-sm text-neutral-400 sm:text-base">
          {t('site.tagline')}
        </p>
      </section>

      <div className="mb-10">
        <AdBanner size="leaderboard" />
      </div>

      {sections.map(({ genre, games }) => (
        <section key={genre} className="mb-10">
          <h2 className="mb-4 flex items-baseline gap-3 font-mono text-lg font-bold tracking-tight text-neutral-100 sm:text-xl">
            <span className="text-amber-400">{t(`genre.${genre}`)}</span>
            <span className="font-mono text-xs text-neutral-500">
              {games.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {games.map((game) => (
              <GameCard key={game.slug} game={game} locale={locale} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
