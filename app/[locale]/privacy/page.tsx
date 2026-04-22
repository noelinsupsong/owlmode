import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('privacy') };
}

const CONTENT: Record<string, { title: string; body: React.ReactNode }> = {
  ko: {
    title: '개인정보처리방침',
    body: (
      <>
        <p>
          RetroArcade(이하 &quot;사이트&quot;)는 사용자의 개인정보를 소중히
          여기며, 본 방침에 따라 처리합니다.
        </p>
        <h2 className="mt-6 text-xl font-bold">1. 수집하는 정보</h2>
        <p>
          사이트는 회원가입 기능이 없으며, 개인 식별 정보를 직접 수집하지
          않습니다. 게임 점수와 플레이 횟수는 사용자의 브라우저 localStorage에만
          저장되며 서버로 전송되지 않습니다.
        </p>
        <h2 className="mt-6 text-xl font-bold">2. 쿠키 및 광고</h2>
        <p>
          사이트는 향후 Google AdSense를 통한 광고를 게재할 수 있습니다.
          AdSense는 쿠키를 사용하여 사용자의 관심사에 기반한 광고를 표시할 수
          있습니다. 자세한 내용은{' '}
          <a
            href="https://policies.google.com/technologies/ads"
            className="text-amber-400 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google 광고 정책
          </a>
          을 참고하세요.
        </p>
        <h2 className="mt-6 text-xl font-bold">3. 외부 링크</h2>
        <p>
          사이트는 외부 사이트로의 링크를 포함할 수 있으며, 외부 사이트의 개인
          정보 처리에 대해 책임지지 않습니다.
        </p>
        <h2 className="mt-6 text-xl font-bold">4. 문의</h2>
        <p>본 방침에 대한 문의는 사이트 운영자에게 이메일로 문의해 주세요.</p>
      </>
    ),
  },
  en: {
    title: 'Privacy Policy',
    body: (
      <>
        <p>
          RetroArcade (the &quot;Site&quot;) values your privacy and processes
          information according to this policy.
        </p>
        <h2 className="mt-6 text-xl font-bold">1. Information We Collect</h2>
        <p>
          The Site has no account system and does not directly collect personal
          identifiers. Game scores and play counts are stored only in your
          browser&apos;s localStorage and are never sent to a server.
        </p>
        <h2 className="mt-6 text-xl font-bold">2. Cookies and Ads</h2>
        <p>
          The Site may display ads via Google AdSense in the future. AdSense
          uses cookies to serve interest-based ads. See{' '}
          <a
            href="https://policies.google.com/technologies/ads"
            className="text-amber-400 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google&apos;s ad policy
          </a>{' '}
          for details.
        </p>
        <h2 className="mt-6 text-xl font-bold">3. External Links</h2>
        <p>
          The Site may link to external sites. We are not responsible for their
          privacy practices.
        </p>
        <h2 className="mt-6 text-xl font-bold">4. Contact</h2>
        <p>For questions about this policy, please contact the site owner.</p>
      </>
    ),
  },
};

export default function PrivacyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const c = CONTENT[locale] ?? CONTENT.en;
  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-mono text-3xl font-bold text-amber-400">
        {c.title}
      </h1>
      <div className="space-y-4 text-neutral-300">{c.body}</div>
    </article>
  );
}
