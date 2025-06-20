// /app/dashboard/page.tsx
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardClient from "@/components/DashboardClient";
import { getServerSession } from "next-auth";

import { redirect } from "next/navigation";


export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Welcome, {session.user?.name}</h1>
      <DashboardClient />
    </div>
  );
}
