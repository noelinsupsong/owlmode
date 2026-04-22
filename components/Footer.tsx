import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations();

  return (
    <footer className="mt-12 border-t border-neutral-800 bg-neutral-950 py-6 text-sm text-neutral-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p>{t('footer.made')}</p>
        <div className="flex gap-4">
          <Link
            href={`/${locale}/privacy`}
            className="hover:text-neutral-100"
          >
            {t('nav.privacy')}
          </Link>
          <Link
            href={`/${locale}/licenses`}
            className="hover:text-neutral-100"
          >
            {t('nav.licenses')}
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-2 max-w-6xl px-4 text-xs text-neutral-500">
        {t('footer.copyright')}
      </div>
    </footer>
  );
}
