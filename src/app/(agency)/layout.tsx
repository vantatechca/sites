import { getServerSession } from "@/lib/auth";
import { AgencyShell } from "./agency-shell";

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const user = {
    name: session?.user?.name ?? "Guest",
    email: session?.user?.email ?? "",
    image: session?.user?.image ?? null,
  };

  return (
    <AgencyShell user={user}>
      {children}
    </AgencyShell>
  );
}
