import React from "react";
import Image from "next/image"; // If using Next.js

const GooglePlayDownloadButton = () => {
  const androidUrl =
    "https://play.google.com/store/apps/details?id=com.loa.lawofattraction.prod";
  const iosAppId = "6754241860";
  const androidPackageName = "com.loa.lawofattraction.prod";

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

    // Always open Google Play Store
    window.open(androidUrl, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      style={{ border: "none", background: "none", padding: 0 }}
    >
      <Image
        src="/buttons/google-play-badge.png"
        alt="Get it on Google Play"
        className="w-[150px] h-[45px]"
        width={150} // Adjust width as needed
        height={50} // Adjust height as needed
      />
    </button>
  );
};

export default GooglePlayDownloadButton;
