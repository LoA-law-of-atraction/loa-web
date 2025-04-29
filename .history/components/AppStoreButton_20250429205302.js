const AppStoreButton = ({ store }) => {
  const handleRedirect = () => {
    if (store === "appstore") {
      window.location.href = "https://apps.apple.com"; // Replace with your App Store link
    } else if (store === "googleplay") {
      window.location.href = "https://play.google.com/store"; // Replace with your Google Play link
    }
  };

  return (
    <button
      className="text-white active:scale-95 transition-all relative group cursor-pointer font-bold rounded-lg p-0.5 shadow-lg bg-gradient-to-tr from-blue-500 to-blue-700 focus:outline-none focus:shadow-outline"
      onClick={handleRedirect}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
      <div className="bg-bg relative text-[3vw] md:text-body p-3 rounded-lg">
        {store === "appstore" ? "Download on the App Store" : "Get it on Google Play"}
      </div>
    </button>
  );
};

export default AppStoreButton;