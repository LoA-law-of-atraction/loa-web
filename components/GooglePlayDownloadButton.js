import React from "react";
import Image from "next/image"; // If using Next.js

const GooglePlayDownloadButton = () => {
  const androidUrl =
    "https://play.google.com/store/apps/details?id=com.loa.lawofattraction.prod";
  const iosAppId = "6754241860";
  const androidPackageName = "com.loa.lawofattraction.prod";

  const handleClick = () => {
    if (typeof window !== "undefined") {
      if (typeof window.fbq === "function") {
        window.fbq("trackCustom", "GOOGLE_PLAY_Click", {
          button_name: "Google Play",
        });
      }
    }

    window.open(androidUrl, "_blank");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="min-h-[48px] flex items-center"
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
