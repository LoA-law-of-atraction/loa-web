import { GooglePlayButton, ButtonsContainer } from "react-mobile-app-button";

const GooglePlayDownloadButton = () => {
  const androidUrl =
    "https://play.google.com/store/apps/details?id=com.ever.journal";

  return (
    <ButtonsContainer>
      <GooglePlayButton url={androidUrl} theme="dark" className="font-inter" />
    </ButtonsContainer>
  );
};

export default GooglePlayDownloadButton;
