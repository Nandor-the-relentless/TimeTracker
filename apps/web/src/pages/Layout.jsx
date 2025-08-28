// apps/web/src/pages/Layout.jsx
import React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Clock,
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  FileText,
  User as UserIcon,
  LogOut,
  Menu,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { base44, supabase } from "@/api/base44Client"

export default function Layout({ children, currentPageName }) {
  const location = useLocation()
  const navigate = useNavigate()

  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let unsub
    ;(async () => {
      try {
        const me = await base44.entities.UserEntity.me()
        if (me?.user) {
          const full_name =
            me.profile?.full_name ??
            me.user.user_metadata?.full_name ??
            (me.user.email ? me.user.email.split("@")[0] : "User")
          const email = me.user.email ?? ""
          const role = String(me.profile?.role || "user").toLowerCase()
          setUser({ full_name, email, role })
        }
      } catch (e) {
        console.error("Load user failed:", e)
        // Don't redirect here - let RequireAuth handle it
      } finally {
        setLoading(false)
      }

      unsub = supabase.auth.onAuthStateChange((_e, session) => {
        if (!session?.user) {
          setUser(null)
          // Let RequireAuth handle the redirect, don't navigate here
        }
      }).data.subscription
    })()
    return () => unsub?.unsubscribe()
  }, [])

  async function handleLogout() {
    try {
      await base44.entities.UserEntity.logout()
      // RequireAuth will handle the redirect to login
    } catch (e) {
      console.error("Logout failed:", e)
      navigate("/login", { replace: true })
    }
  }

  const navigationItems = [
    { title: "Dashboard",  url: "/",              icon: LayoutDashboard, roles: ["admin", "manager", "user"] },
    { title: "Time Clock", url: "/timesheet",     icon: Clock,          roles: ["admin", "manager", "user"] },
    { title: "PTO",        url: "/pto",           icon: Calendar,       roles: ["admin", "manager", "user"] },
    { title: "Team",       url: "/team",          icon: Users,          roles: ["admin", "manager"] },
    { title: "Reports",    url: "/reports",       icon: FileText,       roles: ["admin", "manager"] },
    { title: "Admin",      url: "/admin",         icon: Settings,       roles: ["admin"] },
  ]

  const roleColors = {
    admin: "bg-red-100 text-red-800",
    manager: "bg-blue-100 text-blue-800",
    user: "bg-green-100 text-green-800",
  }

  const filteredNavItems = navigationItems.filter((i) => !user || i.roles.includes(user.role))

  // Show loading spinner while fetching user data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  // If no user after loading, show a minimal loading state
  // RequireAuth should handle the redirect, but this prevents flash of content
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="border-b border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Treats Time by WT</h2>
                <p className="text-xs text-slate-500">Time Management</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url ? "bg-blue-50 text-blue-700 border-blue-200" : ""
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{user.full_name || "User"}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email || ""}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge className={`${roleColors[user.role] || roleColors.user} text-xs font-medium`}>
                {user.role?.toUpperCase?.() || "USER"}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          {/* Mobile header */}
          <header className="bg-white border-b border-slate-200 px-4 py-3 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger>
                <Menu className="w-6 h-6" />
              </SidebarTrigger>
              <h1 className="text-lg font-semibold text-slate-900">Treats Time by WT</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}