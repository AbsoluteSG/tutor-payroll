import { requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile-form";

/**
 * A manager's own account settings. Same form as the tutor-side profile page,
 * but under the admin layout so managers keep their own nav — this matters once
 * there is more than one admin, each with their own login.
 */
export default async function AdminProfilePage() {
  const sessionUser = await requireManager();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, username: true },
  });

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Your profile</CardTitle>
        <CardDescription>Update your name, login details, and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileForm
          initial={{
            name: user?.name ?? "",
            email: user?.email ?? "",
            username: user?.username ?? "",
          }}
        />
      </CardContent>
    </Card>
  );
}
