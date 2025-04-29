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
        src="/buttons/app-store-badge.png"
        alt="Download on the App Store"
        width={150} // Adjust width as needed
        height={50} // Adjust height as needed
      />
    </a>
  );
};

export default AppStoreDownloadButton;
