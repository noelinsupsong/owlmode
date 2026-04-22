import fs from 'node:fs/promises';
import path from 'node:path';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('licenses') };
}

export default async function LicensesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const filePath = path.join(process.cwd(), 'public', 'licenses', 'CREDITS.md');
  const raw = await fs.readFile(filePath, 'utf-8');

  const heading = locale === 'ko' ? '오픈소스 라이선스' : 'Open Source Licenses';
  const intro =
    locale === 'ko'
      ? '본 사이트에서 사용된 오픈소스 코드와 자산의 출처입니다. 모든 항목은 MIT, Apache 2.0, CC0, 또는 Public Domain 라이선스를 따릅니다.'
      : 'Sources of open source code and assets used on this site. All listed items are MIT, Apache 2.0, CC0, or Public Domain.';

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 font-mono text-3xl font-bold text-amber-400">
        {heading}
      </h1>
      <p className="mb-6 text-sm text-neutral-400">{intro}</p>
      <pre className="whitespace-pre-wrap rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-xs text-neutral-300">
        {raw}
      </pre>
    </article>
  );
}
