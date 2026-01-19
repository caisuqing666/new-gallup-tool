'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, Locale } from '@/i18n/config';

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // localePrefix: 'always' 模式下，所有语言都有前缀
    // 移除当前语言前缀
    const currentLocalePrefix = `/${locale}`;
    let pathWithoutLocale = pathname;
    if (pathname.startsWith(currentLocalePrefix)) {
      pathWithoutLocale = pathname.slice(currentLocalePrefix.length) || '/';
    }

    // 添加新语言前缀
    const newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;

    router.push(newPath);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLanguageChange(loc)}
          className={`
            px-3 py-1.5 text-sm rounded-full transition-all duration-200
            ${locale === loc
              ? 'bg-brand text-white'
              : 'bg-black/5 text-text-secondary hover:bg-black/10'
            }
          `}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}
