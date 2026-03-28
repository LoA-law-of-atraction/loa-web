import React from "react";
import Image from "next/image"; // If using Next.js

const AppStoreDownloadButton = () => {
  const iosUrl = "https://apps.apple.com/app/6754241860";
  const iosAppId = "6754241860";
  const androidPackageName = "com.loa.lawofattraction.prod";

  const handleClick = () => {
    if (typeof window !== "undefined") {
      if (typeof window.fbq === "function") {
        window.fbq("trackCustom", "APP_STORE_Click", {
          button_name: "App Store",
        });
      }

      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (/android/i.test(userAgent)) {
        // Open Google Play Store in a new tab
        window.open(
          `https://play.google.com/store/apps/details?id=${androidPackageName}`,
          "_blank"
        );
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        // Open Apple App Store in a new tab
        window.open(`https://apps.apple.com/app/id${iosAppId}`, "_blank");
      } else {
        // Fallback to a landing page or website
        window.open(iosUrl, "_blank");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="min-h-[48px] flex items-center"
      style={{ border: "none", background: "none", padding: 0 }}
    >
      <Image
        src="/buttons/app-store-badge.svg"
        alt="Download on the App Store"
        className="w-[150px] h-[45px]"
        width={150}
        height={45}
      />
    </button>
  );
};

export default AppStoreDownloadButton;
