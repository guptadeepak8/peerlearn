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
      <DashboardClient />
    </div>
  );
}
