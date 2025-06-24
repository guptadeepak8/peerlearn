"use client";
import { LoginForm } from "@/components/login-form";
import {  useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function LoginPage() {
  const { data: session } = useSession();
  const router =useRouter()
    useEffect(() => {
    if (session) {
      router.push("/dashboard"); 
    }
  }, [session]);

  return (
     <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm />
      </div>
    </div>
  );
}
