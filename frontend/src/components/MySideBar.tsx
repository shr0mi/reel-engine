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
} from "@/components/ui/sidebar"
import {useLocation, Link} from "react-router"
import { Video, Captions, View, Download, Bot } from "lucide-react"

const menuItemsCoolCaptions = [
  {
    title: "Overview",
    url: "/cool-captions/",
    icon: View,
  },
  {
    title: "Transcribe Video",
    url: "/cool-captions/transcribe",
    icon: Video,
  },
  {
    title: "Generate Captions",
    url: "/cool-captions/caption",
    icon: Captions,
  },
  {
    title: "Render Video",
    url: "/cool-captions/render",
    icon: Download,
  },
]

export function AppSidebar() {
  // Get path name
  const {pathname} = useLocation();

  // Determine current module
  let currentModule: "cool-captions" | null = null;
  if (pathname.startsWith("/cool-captions")) {
    currentModule = "cool-captions";
  }

  const menuItems = currentModule === "cool-captions" ? menuItemsCoolCaptions : [];

  const sideBarLabel = currentModule === "cool-captions" ? "CoolCaptions" : "";

  if (menuItems.length === 0) {
    return(
      <>
      
      </>
    )
  }

  return (
    <Sidebar>
        <SidebarHeader className="font-bold">
            <Link to="/" className="text-xl font-bold tracking-tight text-zinc-900">
              AutoReel<span className="text-zinc-500">Engine</span>
            </Link>
        </SidebarHeader>
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>{sideBarLabel}</SidebarGroupLabel>
                <SidebarGroupContent>
                <SidebarMenu>
                {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                        <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        </a>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
          </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup />
        </SidebarContent>
        <SidebarFooter />
    </Sidebar>
  )
}