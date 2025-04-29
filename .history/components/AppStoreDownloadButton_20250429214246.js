import { AppStoreButton, ButtonsContainer } from "react-mobile-app-button";

const AppStoreDownloadButton = () => {
  const iosUrl = "https://apps.apple.com/app/6740745547";

  return (
    <ButtonsContainer>
      <AppStoreButton url={iosUrl} theme="dark" />
    </ButtonsContainer>
  );
};

export default AppStoreDownloadButton;
