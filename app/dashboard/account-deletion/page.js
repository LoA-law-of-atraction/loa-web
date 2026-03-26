import AccountDeletionClient from "@/app/account-deletion/AccountDeletionClient";

export const metadata = {
  title: "Delete Account | LoA - Law of Attraction App",
  description:
    "Delete your LoA account and associated cloud data. This permanently removes your account profile and synced content.",
  alternates: {
    canonical: "/dashboard/account-deletion",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function DashboardAccountDeletionPage() {
  return <AccountDeletionClient />;
}
