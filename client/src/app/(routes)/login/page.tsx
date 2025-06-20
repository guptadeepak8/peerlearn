"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
      const target = e.target as typeof e.target & {
    username: { value: string };
    password: { value: string };
  };

    setLoading(true);
   const res = await signIn("credentials", {
      redirect: false,
      callbackUrl: "/dashboard",
      username: target.username.value,
      password: target.password.value,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid username or password.");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Login</h1>

      <form onSubmit={(e)=>handleLogin(e)} className="space-y-4">
        <input
          name="username"
          placeholder="Username"
          className="w-full border p-2 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
        />
         {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="bg-red-500 text-white py-2 px-4 rounded"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
}
