import { redirect } from "next/navigation";
import DashboardShell from "@/app/_components/dashboard-shell";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/acceso");

  return <DashboardShell email={session.email}>{children}</DashboardShell>;
}
