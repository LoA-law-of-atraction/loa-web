import React from "react";
import Image from "next/image"; // If using Next.js

const GooglePlayDownloadButton = () => {
  const androidUrl =
    "https://play.google.com/store/apps/details?id=com.ever.journal";

  const handleClick = () => {
    if (typeof window !== "undefined") {
      import("react-facebook-pixel").then((module) => {
        const ReactPixel = module.default;
        ReactPixel.init(process.env.NEXT_PUBLIC_META_PIXEL_ID);
        ReactPixel.trackCustom("GOOGLE_PLAY_Click", {
          button_name: "Google Play",
        });
        console.log("Google Play button clicked");
      });
    }
  };

  return (
    <a
      href={androidUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
    >
      <Image
        src="/assets/google-play-badge.png"
        alt="Get it on Google Play"
        width={150} // Adjust width as needed
        height={50} // Adjust height as needed
      />
    </a>
  );
};

export default GooglePlayDownloadButton;
