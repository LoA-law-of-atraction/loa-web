import { AppStoreButton, ButtonsContainer } from "react-mobile-app-button";

const AppStoreDownloadButton = () => {
  const iosUrl = "https://apps.apple.com/app/idyourappid";

  return (
    <ButtonsContainer>
      <AppStoreButton url={iosUrl} className="font-tiempos p-10 bg-slate-700" />
    </ButtonsContainer>
  );
};

export default AppStoreDownloadButton;
