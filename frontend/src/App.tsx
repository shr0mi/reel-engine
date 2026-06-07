import './App.css'
import { Routes, Route } from 'react-router'
import TranscribeVideoPage from "@/pages/TranscribeVideosPage"
import CreateCaptionsPage from "@/pages/CreateCaptionsPage"
import OverviewPage from "@/pages/OverviewPage"
import RenderPage from "@/pages/RenderPage"
import HomePage from "@/pages/HomePage"
import BrandAgentPage from './pages/BrandAgentPage'
import TextToReelPage from './pages/textToReelPage'
import GenerateMeme from "@/pages/GenerateMeme"
import TextToReelRenderPage from './pages/textToReelRenderPage'
import Navbar from './components/NavBar'
import Footer from './components/Footer'


function App() {

  return (
    <>
      {/* <SidebarProvider> */}
      {/* <AppSidebar /> */}
      <main className="flex flex-col min-h-screen w-full">
        {/* <SidebarTrigger /> */}
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/brand-consistency" element={<BrandAgentPage />} />
            <Route path="/cool-captions/" element={<OverviewPage />} />
            <Route
              path="/cool-captions/transcribe"
              element={<TranscribeVideoPage />}
            />
            <Route
              path="/cool-captions/caption"
              element={<CreateCaptionsPage />}
            />
            <Route path="/cool-captions/render" element={<RenderPage />} />

            <Route path="/text-to-reel" element={<TextToReelPage />} />
           
            <Route path="/mister-memer/generate" element={<GenerateMeme />} />
            <Route
              path="/text-to-reel/render"
              element={<TextToReelRenderPage />}
            />
          </Routes>
        </div>
        <Footer />
      </main>
      {/* </SidebarProvider> */}
    </>
  );
}

export default App
