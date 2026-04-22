import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { GAMES, getGame } from '@/lib/games';
import GameLayout from '@/components/GameLayout';
import GameLoader from '@/components/GameLoader';
import { locales } from '@/i18n/request';

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    GAMES.filter((g) => g.enabled).map((g) => ({
      locale,
      slug: g.slug,
    }))
  );
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const game = getGame(slug);
  if (!game) return {};
  const t = await getTranslations({ locale });
  const name = t(`games.${game.slug}.name`);
  const desc = t(`games.${game.slug}.desc`);
  return {
    title: name,
    description: desc,
  };
}

export default function GamePage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const game = getGame(slug);
  if (!game || !game.enabled) notFound();

  return (
    <GameLayout game={game} locale={locale}>
      <GameLoader slug={game.slug} />
    </GameLayout>
  );
}
