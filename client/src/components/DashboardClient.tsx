"use client";

import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { signOut } from "next-auth/react";


export default function DashboardClient() {
  const router = useRouter();
function handleClick() {
  const id = uuidv4(); // ✅ correct and simple
  router.push(`/stream/${id}`);
}

  function handleLogout() {
    signOut({ callbackUrl: "/login" }); // redirect to login page after logout
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleClick}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Click to Stream
      </button>

      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
