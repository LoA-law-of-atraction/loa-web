import AccountDeletionClient from "./AccountDeletionClient";

export const metadata = {
  title: "Delete Account | LoA - Law of Attraction App",
  description:
    "Delete your LoA account and associated cloud data. This permanently removes your account profile and synced content.",
  alternates: {
    canonical: "/account-deletion",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AccountDeletionPage() {
  return <AccountDeletionClient />;
}
