import { GooglePlayButton, ButtonsContainer } from "react-mobile-app-button";

const GooglePlayDownloadButton = () => {
  const androidUrl =
    "https://play.google.com/store/apps/details?id=com.ever.journal";

  const handleClick = () => {
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
