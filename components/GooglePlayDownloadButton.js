import React from "react";
import Image from "next/image"; // If using Next.js
import { trackEvent } from "@/utils/analytics";

const GooglePlayDownloadButton = () => {
  const androidUrl =
    "https://play.google.com/store/apps/details?id=com.loa.lawofattraction.prod";

  const handleClick = () => {
    trackEvent("app_download_clicked", {
      button_name: "google_play",
      destination_store: "google_play",
    });
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
        width={270}
        height={80}
        className="w-[150px] h-auto"
        style={{ width: 150, height: "auto" }}
      />
    </button>
  );
};

export default GooglePlayDownloadButton;
