import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import { notFound } from 'next/navigation';
import {
  Inter,
  Noto_Sans_KR,
  JetBrains_Mono,
  Press_Start_2P,
} from 'next/font/google';
import { locales, type Locale } from '@/i18n/request';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const notoKr = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-noto-kr',
  weight: ['400', '500', '700'],
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const pressStart = Press_Start_2P({
  subsets: ['latin'],
  variable: '--font-pixel',
  weight: ['400'],
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'site' });
  return {
    title: {
      default: `${t('name')} — ${t('tagline')}`,
      template: `%s — ${t('name')}`,
    },
    description: t('tagline'),
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${notoKr.variable} ${jetbrains.variable} ${pressStart.variable}`}
    >
      <body className="min-h-screen bg-neutral-950 font-sans text-neutral-100 antialiased">
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Header locale={locale} />
            <main className="flex-1">{children}</main>
            <Footer locale={locale} />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
