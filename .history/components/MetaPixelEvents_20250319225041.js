"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const MetaPixelEvents = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-facebook-pixel").then((module) => {
        const ReactPixel = module.default;

        if (!window.fbqInitialized) {
          ReactPixel.init(process.env.NEXT_PUBLIC_META_PIXEL_ID);
          window.fbqInitialized = true;
          console.log("Meta Pixel Initialized ✅");
        }

        ReactPixel.pageView();
        console.log(`Meta Pixel Event: PageView triggered for ${pathname}`);

        // ✅ Track "ViewContent" for key pages dynamically
        const trackedPages = ["/features", "/premium", "/about-us"];

        if (trackedPages.includes(pathname)) {
          ReactPixel.track("ViewContent", {
            content_name: pathname.replace("/", "").toUpperCase() + " Page",
          });

          console.log(`Meta Pixel Event: ViewContent triggered on ${pathname}`);
        }
      });
    }
  }, [pathname, searchParams]);

  return null;
};

export default MetaPixelEvents;
