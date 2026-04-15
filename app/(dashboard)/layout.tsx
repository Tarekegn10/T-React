import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null

  try {
    user = await getCurrentUser()
  } catch {
    user = null
  }

  if (!user) {
    redirect("/login")
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
