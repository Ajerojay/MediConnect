import { requireRole } from "@/lib/auth";
import { PortalShell } from "@/components/portal-shell";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("PATIENT");
  return <PortalShell user={user}>{children}</PortalShell>;
}
