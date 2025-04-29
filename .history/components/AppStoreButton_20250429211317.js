import { AppStoreButton, ButtonsContainer } from "react-mobile-app-button";

const AppStoreButton = () => {
  const iosUrl = "https://apps.apple.com/app/idyourappid";

  return (
    <ButtonsContainer>
      <AppStoreButton url={iosUrl} theme="dark" />
    </ButtonsContainer>
  );
};

export default AppStoreButton;
