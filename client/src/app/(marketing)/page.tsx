'use client'
import { signIn } from "next-auth/react";

import { useSession } from "next-auth/react";
export default function Marketingpage() {
   const { data: session } = useSession();
   
  return (
    <div>
        <h1>marketing page</h1>
<div>Welcome {session?.user?.name}</div>;
      <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
      Login with Google
      </button>
    </div>
    
  )
}
