import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Locale } from '@/i18n/config';
import '../globals.css';

// 生成静态参数
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// 国际化 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  // 等待 params 以确保 locale 已设置
  await params;
  const messages = await getMessages();
  const metadata = messages.metadata as { title: string; description: string };

  return {
    title: metadata?.title || '盖洛普优势 · 行动方案生成器',
    description: metadata?.description || '把你的优势，翻译成当下可执行的决策建议',
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 验证 locale 是否有效
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // 启用静态渲染
  setRequestLocale(locale);

  // 获取翻译消息
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
