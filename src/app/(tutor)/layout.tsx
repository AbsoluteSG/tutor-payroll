import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <>
      <AppHeader
        name={user.name}
        links={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/submit", label: "Log a class" },
          { href: "/history", label: "History" },
          { href: "/settings/payouts", label: "Payouts" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
