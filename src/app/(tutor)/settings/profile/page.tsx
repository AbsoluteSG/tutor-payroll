import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
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
