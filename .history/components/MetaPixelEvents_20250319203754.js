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
        ReactPixel.init("489803712358979");
        ReactPixel.pageView();
      });
  }, [pathname, searchParams]);

  return null;
};

export default MetaPixelEvents;
