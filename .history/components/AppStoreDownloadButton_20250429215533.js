import { AppStoreButton, ButtonsContainer } from "react-mobile-app-button";

const AppStoreDownloadButton = () => {
  const iosUrl = "https://apps.apple.com/app/6740745547";

  const handleClick = () => {
    ReactPixel.init(process.env.NEXT_PUBLIC_META_PIXEL_ID);
    ReactPixel.trackCustom("APP_STORE_Click", {
      button_name: text,
    });
    console.log("App Store button clicked");
  };

  return (
    <ButtonsContainer>
      <div onClick={handleClick} style={{ cursor: 'pointer' }
        <AppStoreButton url={iosUrl} theme="dark" />
      </div>
    </ButtonsContainer>
  );
};

export default AppStoreDownloadButton;
