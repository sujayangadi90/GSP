import { serviceApi } from '@/utils/api';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalsolarpower.in'; // Replace with default or environment domain

  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/training/landingpage`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  let dynamicRoutes = [];

  try {
    // Fetch categories and services for dynamic routes
    const [categories, services] = await Promise.all([
      serviceApi.getCategories().catch(() => []),
      serviceApi.getServices().catch(() => []),
    ]);

    const activeCategories = categories.filter((c) => c.isActive !== false);
    const activeServices = services.filter((s) => s.isActive !== false);

    // Add category routes
    const categoryRoutes = activeCategories.map((category) => ({
      url: `${baseUrl}/services/${category.slug}`,
      lastModified: new Date(category.updatedAt || new Date()),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Add service routes under their categories
    const serviceRoutes = activeServices.map((service) => {
      const categorySlug = service.category && service.category.slug ? service.category.slug : 'general';
      return {
        url: `${baseUrl}/services/${categorySlug}/${service.slug}`,
        lastModified: new Date(service.updatedAt || new Date()),
        changeFrequency: 'weekly',
        priority: 0.8,
      };
    });

    dynamicRoutes = [...categoryRoutes, ...serviceRoutes];
  } catch (error) {
    console.error('Error generating dynamic sitemap routes:', error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
