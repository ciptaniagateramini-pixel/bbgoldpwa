import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api, type Pengguna } from './lib/api';
import type { DataHarga } from './lib/hitung';
import { Masuk } from './pages/Masuk';
import { Dompet } from './pages/Dompet';
import { Akun } from './pages/Akun';
import { Privasi } from './pages/Privasi';
import { Laporan } from './pages/Laporan';

function Kerangka() {
  const [pengguna, setPengguna] = useState<Pengguna | null | undefined>(undefined);
  const [harga, setHarga] = useState<DataHarga | null>(null);
  const [formBuka, setFormBuka] = useState(false);
  const { pathname } = useLocation();
  const cek = useCallback(() => { api.saya().then(setPengguna).catch(() => setPengguna(null)); }, []);
  useEffect(() => { cek(); api.harga().then(setHarga).catch(() => setHarga(null)); }, [cek]);
  useEffect(() => { scrollTo(0, 0); }, [pathname]);

  return (
    <div className="app">
      <header className="atas">
        <Link to="/" className="merek"><i><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16l3-8h10l3 8z" fill="#1A1406" /></svg></i>Dompet Emas</Link>
        {pengguna && <Link to="/akun" className="avatar" aria-label="Akun">{pengguna.email[0].toUpperCase()}</Link>}
      </header>
      {pengguna === undefined ? <div className="memuat" style={{ marginTop: 30 }} /> : (
        <Routes>
          <Route path="/" element={pengguna ? <Dompet harga={harga} formBuka={formBuka} setFormBuka={setFormBuka} /> : <Masuk selesai={cek} />} />
          <Route path="/akun" element={pengguna ? <Akun pengguna={pengguna} keluar={() => setPengguna(null)} /> : <Navigate to="/" />} />
          <Route path="/laporan" element={pengguna?.admin ? <Laporan /> : <Navigate to="/" />} />
          <Route path="/privasi" element={<Privasi />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
      <footer className="kaki">
        <span>Angka adalah perkiraan berdasarkan harga referensi, bukan penawaran harga dari toko mana pun.</span>
        <span><Link to="/privasi">Kebijakan privasi</Link> · © {new Date().getFullYear()} PT Drajat Wiguna Adidaya</span>
      </footer>
      {pengguna && (
        <nav className="tab" aria-label="Menu">
          <NavLink to="/" end>Dompet</NavLink>
          <Link to="/" className="plus" aria-label="Tambah emas" onClick={() => setFormBuka(true)}>+</Link>
          <NavLink to="/akun">Akun</NavLink>
        </nav>
      )}
    </div>
  );
}

export function App() {
  return <BrowserRouter><Kerangka /></BrowserRouter>;
}
