import { AppStoreButton, ButtonsContainer } from "react-mobile-app-button";

const AppStoreDownloadButton = () => {
  const iosUrl = "https://apps.apple.com/app/idyourappid";

  return (
    <ButtonsContainer>
      <AppStoreButton url={iosUrl} theme="light" className="font-inter" />
    </ButtonsContainer>
  );
};

export default AppStoreDownloadButton;
