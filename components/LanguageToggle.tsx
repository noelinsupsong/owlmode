'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LanguageToggle({ locale }: { locale: string }) {
  const pathname = usePathname();

  function pathFor(target: string) {
    const segments = pathname.split('/');
    segments[1] = target;
    return segments.join('/') || `/${target}`;
  }

  const linkBase =
    'px-2 py-1 text-xs font-mono uppercase tracking-wider rounded transition';
  const active = 'bg-neutral-100 text-neutral-900';
  const inactive = 'text-neutral-400 hover:text-neutral-100';

  return (
    <div className="flex gap-1">
      <Link
        href={pathFor('ko')}
        className={`${linkBase} ${locale === 'ko' ? active : inactive}`}
        aria-current={locale === 'ko' ? 'page' : undefined}
      >
        KO
      </Link>
      <Link
        href={pathFor('en')}
        className={`${linkBase} ${locale === 'en' ? active : inactive}`}
        aria-current={locale === 'en' ? 'page' : undefined}
      >
        EN
      </Link>
    </div>
  );
}
