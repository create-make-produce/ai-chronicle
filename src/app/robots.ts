// src/app/robots.ts

import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-chron.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
