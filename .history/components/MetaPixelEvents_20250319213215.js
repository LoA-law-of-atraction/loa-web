"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const MetaPixelEvents = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    import("react-facebook-pixel")
      .then((x) => x.default)
      .then((ReactPixel) => {
        ReactPixel.init(process.env.NEXT_PUBLIC_META_PIXEL_ID);
        ReactPixel.pageView();
      });
  }, [pathname, searchParams]);

  return null;
};

export default MetaPixelEvents;
