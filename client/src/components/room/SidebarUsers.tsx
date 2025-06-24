"use client";

import UserMediaCard from "./usermediacard";


export function SidebarUsers({ users ,userMediaStreams}: { users: string[], userMediaStreams: Record<string, MediaStream>; }) {
  return (
    <div className="w-60 bg-gray-900 text-white p-4 border-r border-gray-700 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Users</h2>
      <ul className="space-y-4">
        {users.map((userId) => (
          <UserMediaCard key={userId} userId={userId} stream={userMediaStreams[userId]}/>
        ))}
      </ul>
    </div>
  );
}


