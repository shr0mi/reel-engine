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

import { Video, Captions, View } from "lucide-react"

const menuItems = [
  {
    title: "Overview",
    url: "/",
    icon: View,
  },
  {
    title: "Transcribe Video",
    url: "/transcribe",
    icon: Video,
  },
  {
    title: "Generate Captions",
    url: "/caption",
    icon: Captions,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
        <SidebarHeader className="font-bold">
            Reel-Engine
        </SidebarHeader>
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>Application</SidebarGroupLabel>
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