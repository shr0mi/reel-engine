import './App.css'
import { Routes, Route, Link } from 'react-router'
import {AppSidebar} from "@/components/MySideBar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import TranscribeVideoPage from "@/pages/TranscribeVideosPage"
import CreateCaptionsPage from "@/pages/CreateCaptionsPage"
import OverviewPage from "@/pages/OverviewPage"

function App() {

  return (
    <>
      <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {/* Routes */}
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/transcribe" element={<TranscribeVideoPage />} />
            <Route path="/caption" element={<CreateCaptionsPage />} />
          

        </Routes>
      </main>
    </SidebarProvider>
    </>
  )
}

export default App
