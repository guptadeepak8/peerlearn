"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Button } from "./ui/button";


export default function Dashboard() {
  const router = useRouter();
function handleClick() {
  const id = uuidv4(); 
  router.push(`/stream/${id}`);
}

  
  return (
    <div className="space-y-4">
      <Button
        onClick={handleClick}
      >
        <PlusIcon /> New Room
      </Button>
    </div>
  );
}
