import {
  GooglePlayButton as GooglePlayDownloadButton,
  ButtonsContainer,
} from "react-mobile-app-button";

const GooglePlayDownloadButton = () => {
  const androidUrl =
    "https://play.google.com/store/apps/details?id=your.app.id";

  return (
    <ButtonsContainer>
      <GooglePlayDownloadButton
        url={androidUrl}
        theme="dark"
        className={"custom-style"}
      />
    </ButtonsContainer>
  );
};

export default GooglePlayDownloadButton;
