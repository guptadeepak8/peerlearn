import { NextResponse } from "next/server";

const mockUser = {
  id: 1,
  name: "Deepak",
  username: "admin",
  password: "123",
};

export async function POST(req: Request) {
  const { username, password } = await req.json();

  console.log("Received:", username, password);
  if (username === mockUser.username && password === mockUser.password) {
    const { password, ...userWithoutPassword } = mockUser;
    return NextResponse.json(userWithoutPassword);
  }

  return new NextResponse(JSON.stringify({ message: "Invalid credentials" }), {
    status: 401,
  });
}
