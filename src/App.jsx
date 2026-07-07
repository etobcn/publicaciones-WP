import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Layout from './Layout.jsx';
import PageNotFound from './lib/PageNotFound';
import Publicaciones from './pages/Publicaciones';
import Premios from './pages/Premios';
import Envios from './pages/Envios';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/Publicaciones" replace />} />
          <Route path="/Publicaciones" element={<Layout currentPageName="Publicaciones"><Publicaciones /></Layout>} />
          <Route path="/Premios" element={<Layout currentPageName="Premios"><Premios /></Layout>} />
          <Route path="/Envios" element={<Layout currentPageName="Envios"><Envios /></Layout>} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
