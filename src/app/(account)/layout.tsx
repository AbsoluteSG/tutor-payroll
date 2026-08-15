import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

/**
 * The parent-facing area.
 *
 * Deliberately its own shell rather than the staff AppHeader: a family should
 * never see a nav that mentions payouts, submissions or other clients, and
 * reusing that component would put the two one careless prop away from each
 * other. `requireClient` runs here, so every page beneath it is guarded even if
 * a new one forgets to guard itself.
 *
 * ─── Why the (account) route group ──────────────────────────────────────────
 * The group contributes nothing to the URL — /account is still /account — but
 * it keeps the sign-in page OUT of this layout. With the login page nested
 * under a layout that requires a signed-in client, an anonymous visitor was
 * redirected to /account/login, which was itself behind this guard, which
 * redirected them again: a 307 loop that made the page unreachable. The door
 * cannot be inside the room it unlocks, so /account/login lives in
 * app/account/login and only the guarded pages live in here.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = await requireClient();

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/account" className="font-semibold">
            Borough Prep
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {client.displayName ?? client.paymentName}
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
