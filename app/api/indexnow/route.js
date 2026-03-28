import { NextResponse } from "next/server";

const HOST = "www.loa-lawofattraction.co";

/** URLs to notify search engines (keep in sync with app/sitemap.js). */
const URL_LIST = [
  "https://www.loa-lawofattraction.co/",
  "https://www.loa-lawofattraction.co/about-us",
  "https://www.loa-lawofattraction.co/features",
  "https://www.loa-lawofattraction.co/resources",
  "https://www.loa-lawofattraction.co/pricing",
  "https://www.loa-lawofattraction.co/download",
  "https://www.loa-lawofattraction.co/updates",
  "https://www.loa-lawofattraction.co/contact-us",
  "https://www.loa-lawofattraction.co/privacy-policy",
  "https://www.loa-lawofattraction.co/terms-and-conditions",
];

/**
 * POST to submit the site URL list to IndexNow (Bing, Yandex, etc.).
 * Set INDEXNOW_KEY to match public/{INDEXNOW_KEY}.txt
 * Optional: INDEXNOW_SUBMIT_SECRET — require Authorization: Bearer <secret>
 */
export async function POST(request) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "INDEXNOW_KEY is not configured" },
      { status: 503 }
    );
  }

  const submitSecret = process.env.INDEXNOW_SUBMIT_SECRET;
  if (submitSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${submitSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: HOST,
        key,
        keyLocation: `https://www.loa-lawofattraction.co/${key}.txt`,
        urlList: URL_LIST,
      }),
    });

    const text = await res.text();
    return NextResponse.json({
      ok: res.ok,
      indexNowStatus: res.status,
      indexNowBody: text || null,
      urlCount: URL_LIST.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "IndexNow request failed" },
      { status: 502 }
    );
  }
}
