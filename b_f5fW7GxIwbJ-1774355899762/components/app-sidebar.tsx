"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Upload,
  Search,
  FolderOpen,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Shield,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

const mainNavItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Documents", icon: FileText, href: "/documents" },
  { title: "Upload", icon: Upload, href: "/upload" },
  { title: "Search", icon: Search, href: "/search" },
  { title: "Categories", icon: FolderOpen, href: "/categories" },
]

const systemNavItems = [
  { title: "Reports", icon: BarChart3, href: "/reports" },
  { title: "Employees", icon: Users, href: "/users" },
  { title: "Settings", icon: Settings, href: "/settings" },
]

const adminNavItems = [
  { title: "Admin Settings", icon: Shield, href: "/admin-settings" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const { user, logout, isAdmin } = useAuth()
  const isCollapsed = state === "collapsed"

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className={cn("p-4", isCollapsed && "p-2")}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
          {isCollapsed ? (
            <SidebarTrigger className="size-8 text-muted-foreground hover:text-foreground" />
          ) : (
            <>
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <FileText className="size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-base font-semibold text-sidebar-foreground">
                  DocuFlow
                </span>
                <span className="text-xs text-muted-foreground">
                  Document Management
                </span>
              </div>
              <SidebarTrigger className="ml-auto size-7 text-muted-foreground hover:text-foreground shrink-0" />
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="h-10 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="h-10 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.title}
                      className="h-10 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      <Link href={item.href}>
                        <item.icon className="size-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className={cn("p-4", isCollapsed && "p-2")}>
        {!isCollapsed && <Separator className="mb-4" />}
        <div className={cn("flex items-center", isCollapsed ? "flex-col gap-2" : "gap-3")}>
          <Link href="/profile" className="block">
            <Avatar className={cn(
              "border-2 border-primary/20 hover:border-primary transition-colors cursor-pointer",
              isCollapsed ? "size-8" : "size-9"
            )}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="size-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {user ? getInitials(user.name) : "?"}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
          {isCollapsed ? (
            <button 
              onClick={() => {
                void logout()
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          ) : (
            <>
              <Link href="/profile" className="flex flex-col flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.name || "Guest"}
                  </span>
                  {isAdmin && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                      Admin
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email || ""}
                </span>
              </Link>
              <button 
                onClick={() => {
                  void logout()
                }}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              >
                <LogOut className="size-4" />
              </button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
