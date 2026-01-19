import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // 获取请求的 locale
  let locale = await requestLocale;

  // 确保使用有效的 locale
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
