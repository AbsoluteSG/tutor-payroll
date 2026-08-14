import { requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireManager();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } });

  return (
    <>
      <AppHeader
        name={dbUser?.name ?? user.name}
        links={[
          { href: "/admin", label: "Overview" },
          { href: "/admin/tutors", label: "Tutors" },
          { href: "/admin/clients", label: "Clients" },
          { href: "/admin/schedule", label: "Schedule" },
          { href: "/admin/bookings", label: "Bookings" },
          { href: "/admin/submissions", label: "Submissions" },
          { href: "/admin/enquiries", label: "Enquiries" },
          { href: "/admin/chat", label: "Live chat" },
          { href: "/admin/invites", label: "Invites" },
          { href: "/admin/profile", label: "Profile" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
