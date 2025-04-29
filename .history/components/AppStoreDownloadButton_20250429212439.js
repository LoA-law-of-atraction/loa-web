import { AppStoreButton, ButtonsContainer } from "react-mobile-app-button";

const AppStoreDownloadButton = () => {
  const iosUrl = "https://apps.apple.com/app/idyourappid";

  return (
    <ButtonsContainer>
      <AppStoreButton
        url={iosUrl}
        className="font-ubuntu bg-white text-white"
      />
    </ButtonsContainer>
  );
};

export default AppStoreDownloadButton;
