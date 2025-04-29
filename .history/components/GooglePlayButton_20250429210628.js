import {
  GooglePlayButton,
  AppStoreButton,
  ButtonsContainer,
} from "react-mobile-app-button";

const MobileAppButton = () => {
  const androidUrl =
    "https://play.google.com/store/apps/details?id=your.app.id";
  const iosUrl = "https://apps.apple.com/app/idyourappid";

  return (
    <ButtonsContainer>
      <GooglePlayButton url={androidUrl} theme="dark" />
    </ButtonsContainer>
  );
};

export default MobileAppButton;
