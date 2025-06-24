'use client'
import { Code2, Home, Podcast, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavUser } from "./nav-user"
import { useSession } from "next-auth/react"

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
  title: "Code Sessions",
  url: "/sessions",
  icon: Code2,
},
{
  title: "Live Rooms",
  url: "/rooms",
  icon: Podcast,
},
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]



export function DashboardSidebar() {
      const { data: session } = useSession();
  return (
    <Sidebar>
         <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={session?.user} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{session?.user?.name}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}