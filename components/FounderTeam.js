"use client";

import Image from "next/image";

function founderFromEnv(index) {
  const name =
    index === 1
      ? process.env.NEXT_PUBLIC_FOUNDER_1_NAME?.trim()
      : process.env.NEXT_PUBLIC_FOUNDER_2_NAME?.trim();
  if (!name) return null;
  const role =
    index === 1
      ? process.env.NEXT_PUBLIC_FOUNDER_1_ROLE?.trim()
      : process.env.NEXT_PUBLIC_FOUNDER_2_ROLE?.trim();
  const bio =
    index === 1
      ? process.env.NEXT_PUBLIC_FOUNDER_1_BIO?.trim()
      : process.env.NEXT_PUBLIC_FOUNDER_2_BIO?.trim();
  const linkedin =
    index === 1
      ? process.env.NEXT_PUBLIC_FOUNDER_1_LINKEDIN_URL?.trim()
      : process.env.NEXT_PUBLIC_FOUNDER_2_LINKEDIN_URL?.trim();
  const image =
    index === 1
      ? process.env.NEXT_PUBLIC_FOUNDER_1_IMAGE_URL?.trim()
      : process.env.NEXT_PUBLIC_FOUNDER_2_IMAGE_URL?.trim();
  return { name, role, bio, linkedin, image };
}

/**
 * Renders when `NEXT_PUBLIC_FOUNDER_1_NAME` (and optionally founder 2) are set at build time.
 * Headshots: host under `/public` or HTTPS; use square images for best results.
 */
export default function FounderTeam() {
  const foundingYear = process.env.NEXT_PUBLIC_FOUNDING_YEAR?.trim();
  const founders = [founderFromEnv(1), founderFromEnv(2)].filter(Boolean);

  if (founders.length === 0) {
    return foundingYear ? (
      <p className="mt-3 text-sm text-gray-500">Founded {foundingYear}</p>
    ) : null;
  }

  return (
    <div className="mt-10 w-full">
      {foundingYear ? (
        <p className="mb-8 text-sm text-gray-500">Founded {foundingYear}</p>
      ) : null}
      <ul className="grid gap-10 sm:grid-cols-2 text-left">
        {founders.map((f) => (
          <li
            key={f.name}
            className="flex flex-col items-center sm:items-start rounded-2xl border border-gray-100 bg-gray-50/80 p-6 shadow-sm"
          >
            <div className="relative mb-4 h-28 w-28 shrink-0 overflow-hidden rounded-full bg-gray-200">
              {f.image ? (
                f.image.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external headshot URLs may not be in next.config images
                  <img
                    src={f.image}
                    alt={`Portrait of ${f.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={f.image}
                    alt={`Portrait of ${f.name}`}
                    width={112}
                    height={112}
                    className="object-cover"
                  />
                )
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center text-2xl font-semibold text-gray-500"
                  aria-hidden
                >
                  {f.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-lg font-semibold text-gray-900">{f.name}</p>
            {f.role ? (
              <p className="mt-1 text-sm font-medium text-primary/90">{f.role}</p>
            ) : null}
            {f.bio ? (
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{f.bio}</p>
            ) : null}
            {f.linkedin ? (
              <a
                href={f.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                LinkedIn profile
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
