import { GooglePlayButton, ButtonsContainer } from "react-mobile-app-button";

const GooglePlayDownloadButton = () => {
  const androidUrl =
    "https://play.google.com/store/apps/details?id=com.ever.journal";

  const handleClick = () => {
    ReactPixel.init(process.env.NEXT_PUBLIC_META_PIXEL_ID);
    ReactPixel.trackCustom("CTA_Click", {
      button_name: text,
    });
    console.log("App Store button clicked");
  };

  return (
    <ButtonsContainer>
      <div onClick={handleClick}>
        <GooglePlayButton url={androidUrl} theme="dark" />
      </div>
    </ButtonsContainer>
  );
};

export default GooglePlayDownloadButton;
