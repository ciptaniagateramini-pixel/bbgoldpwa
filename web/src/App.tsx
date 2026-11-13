import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HargaProvider } from './lib/HargaContext';
import { Beranda } from './pages/Beranda';
import { Kalkulator } from './pages/Kalkulator';
import { Artikel, Edukasi } from './pages/Edukasi';
import { Toko } from './pages/Toko';
import { Privasi } from './pages/Privasi';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <HargaProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Beranda />} />
            <Route path="kalkulator" element={<Kalkulator />} />
            <Route path="edukasi" element={<Edukasi />} />
            <Route path="edukasi/:slug" element={<Artikel />} />
            <Route path="toko" element={<Toko />} />
            <Route path="privasi" element={<Privasi />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HargaProvider>
  );
}
