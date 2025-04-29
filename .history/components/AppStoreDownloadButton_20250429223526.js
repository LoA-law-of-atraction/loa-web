import React from "react";
import Image from "next/image"; // If using Next.js

const AppStoreDownloadButton = () => {
  const iosUrl = "https://apps.apple.com/app/6740745547";

  const handleClick = () => {
    if (typeof window !== "undefined") {
      import("react-facebook-pixel").then((module) => {
        const ReactPixel = module.default;
        ReactPixel.init(process.env.NEXT_PUBLIC_META_PIXEL_ID);
        ReactPixel.trackCustom("APP_STORE_Click", {
          button_name: "App Store",
        });
        console.log("App Store button clicked");
      });

      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (/android/i.test(userAgent)) {
        // Redirect to Google Play Store
        window.location.href = `market://details?id=${androidPackageName}`;
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        // Redirect to Apple App Store
        window.location.href = `itms-apps://itunes.apple.com/app/id${iosAppId}`;
      } else {
        // Fallback to a landing page or website
        window.location.href = "https://www.yourwebsite.com";
      }
    }
  };

  return (
    <a
      href={iosUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
    >
      <Image
        src="/buttons/app-store-badge.svg"
        alt="Download on the App Store"
        className="w-[150px] h-[45px]"
        width={150} // Adjust width as needed
        height={10} // Adjust height as neede
      />
    </a>
  );
};

export default AppStoreDownloadButton;
