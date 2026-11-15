import { useEffect, useState } from 'react';
import { api, pesanGalat } from '../lib/api';

type L = { pengguna: number; pengguna_7hari: number; aktif_7hari: number; boleh_dihubungi: number; aset: number; gram_perhiasan: number;
  per_kadar: { kadar: string; jumlah: number; gram: number }[]; per_merek: { merek: string; jumlah: number; keping: number }[] };

export function Laporan() {
  const [d, setD] = useState<L | null>(null);
  const [salah, setSalah] = useState('');
  useEffect(() => { api.admin().then((x) => setD(x as unknown as L)).catch((e) => setSalah(pesanGalat(e))); }, []);
  return (
    <section className="halaman">
      <h1>Laporan pemilik</h1>
      <p className="kecil">Angka ringkasan tanpa data pribadi.</p>
      {salah && <p className="galat">{salah}</p>}
      {d && (
        <>
          <div className="statistik">
            <div><small>Pengguna</small><b>{d.pengguna}</b></div>
            <div><small>Baru 7 hari</small><b>{d.pengguna_7hari}</b></div>
            <div><small>Aktif 7 hari</small><b>{d.aktif_7hari}</b></div>
            <div><small>Aset tercatat</small><b>{d.aset}</b></div>
            <div><small>Gram perhiasan</small><b>{Math.round(d.gram_perhiasan)}</b></div>
            <div><small>Boleh dihubungi</small><b>{d.boleh_dihubungi}</b></div>
          </div>
          <div className="kotak"><b>Perhiasan per kadar</b>{d.per_kadar.map((r) => <div key={r.kadar} className="baris-akun kecil"><span>{r.kadar}</span><span>{r.jumlah} aset · {r.gram} g</span></div>)}</div>
          <div className="kotak"><b>Logam mulia per merek</b>{d.per_merek.map((r) => <div key={r.merek} className="baris-akun kecil"><span>{r.merek}</span><span>{r.jumlah} aset · {r.keping} keping</span></div>)}</div>
          <a className="tombol t-kaca" href="/api/admin.php?csv=harian">Unduh CSV harian (untuk Google Sheets)</a>
          <a className="tombol t-kaca" href="/api/admin.php?csv=kontak">Unduh CSV kontak yang setuju dihubungi</a>
        </>
      )}
    </section>
  );
}
