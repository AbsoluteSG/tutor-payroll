import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function AppHeader({
  name,
  links,
}: {
  name: string;
  links: { href: string; label: string }[];
}) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        <Link href="/" className="font-semibold">
          Tutor Payroll
        </Link>
        <nav className="flex gap-4 text-sm text-neutral-600">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-neutral-900">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-neutral-500">{name}</span>
          <form action={logoutAction}>
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
