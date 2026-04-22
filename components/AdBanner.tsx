import { getTranslations } from 'next-intl/server';

type AdSize = 'leaderboard' | 'rectangle' | 'mobileBanner';

const sizeClass: Record<AdSize, string> = {
  leaderboard: 'h-[90px] w-full max-w-[728px] mx-auto',
  rectangle: 'h-[250px] w-[300px]',
  mobileBanner: 'h-[50px] w-full',
};

export default async function AdBanner({
  size = 'leaderboard',
  className = '',
}: {
  size?: AdSize;
  className?: string;
}) {
  const t = await getTranslations('common');

  return (
    <div
      className={`flex items-center justify-center rounded border border-dashed border-neutral-700 bg-neutral-900/40 text-xs text-neutral-500 ${sizeClass[size]} ${className}`}
      role="complementary"
      aria-label="Advertisement placeholder"
    >
      {t('adSlot')} ({size})
    </div>
  );
}
