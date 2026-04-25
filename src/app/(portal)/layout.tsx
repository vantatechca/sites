import { getServerSession } from "@/lib/auth";
import { PortalShell } from "./portal-shell";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const clientName = session?.user?.name ?? "Guest";
  const clientAvatar = session?.user?.image ?? undefined;

  return (
    <PortalShell clientName={clientName} clientAvatar={clientAvatar}>
      {children}
    </PortalShell>
  );
}
