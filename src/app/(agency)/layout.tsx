import { AgencyShell } from "./agency-shell";

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In demo mode (no real DB), use default user
  // When auth is configured, this would use getServerSession
  const user = {
    name: "Admin User",
    email: "admin@siteforge.com",
    image: null as string | null,
  };

  return (
    <AgencyShell user={user}>
      {children}
    </AgencyShell>
  );
}
