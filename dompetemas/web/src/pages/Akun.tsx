import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, pesanGalat, type Pengguna } from '../lib/api';

export function Akun({ pengguna, keluar }: { pengguna: Pengguna; keluar: () => void }) {
  const [boleh, setBoleh] = useState(pengguna.boleh_dihubungi);
  const [konfirmasi, setKonfirmasi] = useState('');
  const [tahapHapus, setTahapHapus] = useState(false);
  const [salah, setSalah] = useState('');

  async function atur(v: boolean) {
    setBoleh(v);
    try { await api.atur(v); } catch (e) { setBoleh(!v); setSalah(pesanGalat(e)); }
  }
  async function hapusAkun() {
    try { await api.hapusAkun(); keluar(); } catch (e) { setSalah(pesanGalat(e)); }
  }
  return (
    <section className="halaman">
      <h1>Akun</h1>
      <div className="kotak"><span className="kecil">Masuk sebagai</span><b style={{ overflowWrap: 'anywhere' }}>{pengguna.email}</b></div>
      <div className="kotak">
        <div className="baris-akun">
          <div><b>Boleh dihubungi</b><p className="kecil">Izinkan kami mengirim info harga atau penawaran ke emailmu. Bisa dimatikan kapan saja.</p></div>
          <label className="saklar"><input type="checkbox" checked={boleh} onChange={(e) => atur(e.target.checked)} aria-label="Boleh dihubungi" /><span /></label>
        </div>
      </div>
      {pengguna.admin && <Link className="tombol t-kaca" to="/laporan">Laporan pemilik</Link>}
      <button className="tombol t-kaca" type="button" onClick={async () => { await api.keluar().catch(() => {}); keluar(); }}>Keluar</button>
      <div className="kotak">
        <b>Hapus akun</b>
        <p className="kecil">Menghapus akun beserta semua catatan emasmu secara permanen. Tidak bisa dibatalkan.</p>
        {!tahapHapus ? (
          <button className="tombol t-bahaya" type="button" onClick={() => setTahapHapus(true)}>Hapus akun dan semua data</button>
        ) : (
          <>
            <label htmlFor="konf">Ketik HAPUS untuk konfirmasi</label>
            <input className="isian" id="konf" value={konfirmasi} onChange={(e) => setKonfirmasi(e.target.value)} autoComplete="off" />
            <button className="tombol t-bahaya" type="button" disabled={konfirmasi !== 'HAPUS'} onClick={hapusAkun}>Hapus permanen</button>
          </>
        )}
      </div>
      {salah && <p className="galat" role="alert">{salah}</p>}
      <p className="kecil"><Link to="/privasi">Kebijakan privasi</Link></p>
    </section>
  );
}
