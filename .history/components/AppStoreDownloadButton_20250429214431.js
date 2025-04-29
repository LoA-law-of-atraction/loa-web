import { AppStoreButton, ButtonsContainer } from "react-mobile-app-button";

const AppStoreDownloadButton = () => {
  const iosUrl = "https://apps.apple.com/app/6740745547";

  const handleClick = () => {
    console.log("App Store button clicked");
    // Add your custom logic here
  };

  return (
    <ButtonsContainer>
      <AppStoreButton url={iosUrl} theme="dark" />
    </ButtonsContainer>
  );
};

export default AppStoreDownloadButton;
