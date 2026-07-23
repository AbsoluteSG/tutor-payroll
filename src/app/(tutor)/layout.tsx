import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // Read the name fresh so profile edits reflect immediately (the session JWT caches it).
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } });

  return (
    <>
      <AppHeader
        name={dbUser?.name ?? user.name}
        links={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/submit", label: "Log a class" },
          { href: "/history", label: "History" },
          { href: "/settings/payouts", label: "Payouts" },
          { href: "/settings/profile", label: "Profile" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
