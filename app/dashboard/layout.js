import DashboardShell from "@/components/DashboardShell";
import { RevenueCatProvider } from "@/contexts/RevenueCatContext";

export default function DashboardLayout({ children }) {
  return (
    <RevenueCatProvider>
      <DashboardShell>{children}</DashboardShell>
    </RevenueCatProvider>
  );
}
