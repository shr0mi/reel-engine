import './App.css'
import { Routes, Route, Link } from 'react-router'
import {AppSidebar} from "@/components/MySideBar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import TranscribeVideoPage from "@/pages/TranscribeVideosPage"
import CreateCaptionsPage from "@/pages/CreateCaptionsPage"
import OverviewPage from "@/pages/OverviewPage"
import RenderPage from "@/pages/RenderPage"

function App() {

  return (
    <>
      <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full min-h-screen">
        <SidebarTrigger />
        {/* Routes  */}
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/transcribe" element={<TranscribeVideoPage />} />
            <Route path="/caption" element={<CreateCaptionsPage />} />
            <Route path="/render" element={<RenderPage />} />
          

        </Routes>
      </main>
    </SidebarProvider>
    </>
  )
}

export default App
