import { DashboardSidebar } from "@/components/sidebar/dashboard-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}