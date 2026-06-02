import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { NavBar } from '@/components/layout/NavBar';
import { StagingPage } from '@/pages/StagingPage';
import { ConfigPage } from '@/pages/ConfigPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<StagingPage />} />
            <Route path="/config" element={<ConfigPage />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}
