'use client'


import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
export default function Marketingpage() {
   const { data: session } = useSession();
   const router=useRouter()
   
  return (
    <div>
        <h1>marketing page</h1>
<div>Welcome {session?.user?.name}</div>;
      <button onClick={()=>router.push('/login')}>login</button>
    </div>
    
  )
}
