import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import LanguageToggle from './LanguageToggle';

export default async function Header({ locale }: { locale: string }) {
  const t = await getTranslations('site');

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href={`/${locale}`}
          className="font-pixel text-sm tracking-tight text-amber-400 hover:text-amber-300"
        >
          {t('name')}
        </Link>
        <LanguageToggle locale={locale} />
      </div>
    </header>
  );
}
