import { PortalShell } from "./portal-shell";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In demo mode (no real DB), use default client
  // When auth is configured, this would use getServerSession
  const clientName = "Demo Client";
  const clientAvatar: string | undefined = undefined;

  return (
    <PortalShell clientName={clientName} clientAvatar={clientAvatar}>
      {children}
    </PortalShell>
  );
}
