import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { NavBar } from '@/components/layout/NavBar';
import { LandingPage } from '@/landing/LandingPage';
import { StagingPage } from '@/pages/StagingPage';
import { VideoPage } from '@/pages/VideoPage';
import { ConfigPage } from '@/pages/ConfigPage';

// App shell for the tool pages — keeps the Apple-style NavBar.
function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing landing (see docs/design.md) */}
        <Route path="/" element={<LandingPage />} />

        {/* Tool app */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<StagingPage />} />
          <Route path="video" element={<VideoPage />} />
          <Route path="config" element={<ConfigPage />} />
        </Route>
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}
