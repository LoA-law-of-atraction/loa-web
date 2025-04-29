import { GooglePlayButton, ButtonsContainer } from "react-mobile-app-button";

const GooglePlayDownloadButton = () => {
  const androidUrl =
    "https://play.google.com/store/apps/details?id=com.ever.journal";

  const handleClick = () => {
    if (typeof window !== "undefined") {
      import("react-facebook-pixel").then((module) => {
        const ReactPixel = module.default;

        ReactPixel.init(process.env.NEXT_PUBLIC_META_PIXEL_ID);
        ReactPixel.trackCustom("CTA_Click", {
          button_name: text,
        });

        console.log(`Meta Pixel Event: CTA_Click triggered for ${text}`);
      });
    }
    ReactPixel.init(process.env.NEXT_PUBLIC_META_PIXEL_ID);
    ReactPixel.trackCustom("GOOGLE_PLAY_Click", {
      button_name: "Google Play",
    });
    console.log("Google play button clicked");
  };

  return (
    <ButtonsContainer>
      <div onClick={handleClick} style={{ cursor: "pointer" }}>
        <GooglePlayButton url={androidUrl} theme="dark" />
      </div>
    </ButtonsContainer>
  );
};

export default GooglePlayDownloadButton;
