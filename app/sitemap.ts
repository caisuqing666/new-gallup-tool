import type { MetadataRoute } from 'next';
import { locales } from '../i18n/config';

const baseUrl = 'https://gallup-tool.com';
const publicPaths = ['', '/privacy', '/terms'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return locales.flatMap((locale) =>
    publicPaths.map((path) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: now,
      changeFrequency: path === '' ? 'weekly' : 'monthly',
      priority: path === '' ? 1 : 0.6,
    })),
  );
}
