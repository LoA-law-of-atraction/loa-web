"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export const MetaPixelEvents = () => {
  const pathname = usePathname();

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
        const trackedPages = ["/features", "/pricing", "/about"];

        if (trackedPages.includes(pathname)) {
          ReactPixel.track("ViewContent", {
            content_name: pathname.replace("/", "").toUpperCase() + " Page",
          });

          console.log(`Meta Pixel Event: ViewContent triggered on ${pathname}`);
        }

        // ✅ Track Scroll Depth 50%
        const handleScroll = () => {
          const scrollY = window.scrollY;
          const pageHeight = document.body.scrollHeight;
          const windowHeight = window.innerHeight;

          const scrollPercentage =
            (scrollY / (pageHeight - windowHeight)) * 100;

          if (scrollPercentage > 50) {
            ReactPixel.trackCustom("ScrollDepth50", {
              content_name: "50% Page Scroll",
              page: pathname,
            });

            console.log("Meta Pixel Event: ScrollDepth50 triggered");

            // Remove event listener after firing event once
            window.removeEventListener("scroll", handleScroll);
          }
        };

        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
      });
    }
  }, [pathname]);

  return null;
};

export default MetaPixelEvents;
