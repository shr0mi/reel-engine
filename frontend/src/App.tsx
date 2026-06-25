import './App.css'
import { Routes, Route, useLocation } from 'react-router'
import {AppSidebar} from "@/components/MySideBar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import TranscribeVideoPage from "@/pages/TranscribeVideosPage"
import CreateCaptionsPage from "@/pages/CreateCaptionsPage"
import CoolCaptionsBRollPage from '@/pages/CoolCaptionsBRollPage'
import OverviewPage from "@/pages/OverviewPage"
import RenderPage from "@/pages/RenderPage"
import HomePage from "@/pages/HomePage"
import BrandAgentPage from './pages/BrandAgentPage'
import TextToReelPage from './pages/textToReelPage'
import GenerateMeme from "@/pages/GenerateMeme"
import TextToReelRenderPage from './pages/textToReelRenderPage'
import ProductAdsSelectionPage from './pages/ProductAdsSelectionPage'
import ProductAdsPhonkPage from './pages/ProductAdsPhonkPage'
import ProductAdsPhonkRenderPage from './pages/ProductAdsPhonkRenderPage'


function App() {
  const location = useLocation();
  const hiddenSidebarRoutes = ['/cool-captions/transcribe', '/cool-captions/caption'];
  const showSidebar = !hiddenSidebarRoutes.includes(location.pathname);

  return (
    <>
      <SidebarProvider>
      {showSidebar && <AppSidebar />}
      <main className="flex-1 w-full min-h-screen">
        {showSidebar && <SidebarTrigger />}
        {/* Routes  */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/brand-consistency" element={<BrandAgentPage />} />
            <Route path="/cool-captions/" element={<OverviewPage />} />
            <Route path="/cool-captions/transcribe" element={<TranscribeVideoPage />} />
            <Route path="/cool-captions/caption" element={<CreateCaptionsPage />} />
            <Route path="/cool-captions/b-roll" element={<CoolCaptionsBRollPage />} />
            <Route path="/cool-captions/render" element={<RenderPage />} />

            <Route path="/text-to-reel" element={<TextToReelPage />} />
            <Route path="/mister-memer/generate" element={<GenerateMeme />} />
            <Route path="/text-to-reel/render" element={<TextToReelRenderPage />} />

            <Route path="/product-ads" element={<ProductAdsSelectionPage />} />
            <Route path="/product-ads/phonk-style" element={<ProductAdsPhonkPage />} />
            <Route path="/product-ads/phonk-style/render" element={<ProductAdsPhonkRenderPage />} />


        </Routes>
      </main>
    </SidebarProvider>
    </>
  )
}

export default App