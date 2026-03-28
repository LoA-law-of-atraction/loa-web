/** Last meaningful content updates — bump dates when pages change (SEO). */
const SITE_REFRESH = "2026-03-28";

export default async function sitemap() {
  const baseUrl = "https://www.loa-lawofattraction.co";

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(SITE_REFRESH),
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(SITE_REFRESH),
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(SITE_REFRESH),
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(SITE_REFRESH),
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(SITE_REFRESH),
    },
    {
      url: `${baseUrl}/download`,
      lastModified: new Date(SITE_REFRESH),
    },
    {
      url: `${baseUrl}/updates`,
      lastModified: new Date(SITE_REFRESH),
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date("2025-10-22"),
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date("2025-10-22"),
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: new Date("2025-10-22"),
    },
  ];

  return staticPages;
}
