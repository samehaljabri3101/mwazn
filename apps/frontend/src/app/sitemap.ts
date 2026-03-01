import type { MetadataRoute } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mwazn.sa';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['en', 'ar'];
  const now = new Date();

  // Static routes
  const staticPaths = ['', '/suppliers', '/products', '/rfqs'];
  const staticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: path === '' ? 1.0 : 0.8,
    }))
  );

  // Dynamic: verified supplier slugs
  let supplierRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/companies?type=SUPPLIER&verificationStatus=VERIFIED&limit=500`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const suppliers: Array<{ id: string }> = json?.data?.items ?? json?.data ?? [];
      supplierRoutes = locales.flatMap((locale) =>
        suppliers.map((s) => ({
          url: `${siteUrl}/${locale}/suppliers/${s.id}`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
      );
    }
  } catch { /* skip */ }

  // Dynamic: active listing IDs
  let listingRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/listings?status=ACTIVE&limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const listings: Array<{ id: string; slug?: string }> = json?.data?.items ?? json?.data ?? [];
      listingRoutes = locales.flatMap((locale) =>
        listings.map((l) => ({
          url: `${siteUrl}/${locale}/products/${l.slug ?? l.id}`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }))
      );
    }
  } catch { /* skip */ }

  return [...staticRoutes, ...supplierRoutes, ...listingRoutes];
}
