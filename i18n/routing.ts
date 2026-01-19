import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // 所有语言都带前缀（包括默认语言）
  localePrefix: 'always',
});
