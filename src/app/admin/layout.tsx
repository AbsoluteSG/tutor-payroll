import { requireManager } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireManager();

  return (
    <>
      <AppHeader
        name={user.name}
        links={[
          { href: "/admin", label: "Overview" },
          { href: "/admin/tutors", label: "Tutors" },
          { href: "/admin/clients", label: "Clients" },
          { href: "/admin/submissions", label: "Submissions" },
          { href: "/admin/invites", label: "Invites" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
