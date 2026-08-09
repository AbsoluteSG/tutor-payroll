import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { NavTabs } from "@/components/nav-tabs";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader({
  name,
  links,
}: {
  name: string;
  links: { href: string; label: string }[];
}) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="flex items-center gap-3 pt-3">
          <Link href="/" className="flex items-center gap-2">
            {/* Geist-style triangle mark */}
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              className="size-5 fill-foreground"
            >
              <path d="M8 1.5 15.5 14H.5L8 1.5Z" />
            </svg>
            <span className="text-sm font-semibold tracking-tight">Tutor Payroll</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{name}</span>
            <ThemeToggle className="text-muted-foreground hover:bg-accent" />
            <form action={logoutAction}>
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        <NavTabs links={links} />
      </div>
    </header>
  );
}
