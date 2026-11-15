import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, pesanGalat } from '../lib/api';

export function Masuk({ selesai }: { selesai: () => void }) {
  const [email, setEmail] = useState('');
  const [kode, setKode] = useState('');
  const [tahap, setTahap] = useState<'email' | 'kode'>('email');
  const [salah, setSalah] = useState('');
  const [sibuk, setSibuk] = useState(false);

  async function kirimKode(e?: FormEvent) {
    e?.preventDefault();
    setSalah('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setSalah('Alamat email tidak valid.'); return; }
    setSibuk(true);
    try { await api.kirimKode(email.trim()); setTahap('kode'); setKode(''); } catch (err) { setSalah(pesanGalat(err)); } finally { setSibuk(false); }
  }
  async function masuk(e: FormEvent) {
    e.preventDefault();
    setSalah('');
    if (!/^\d{6}$/.test(kode)) { setSalah('Kode terdiri dari 6 angka.'); return; }
    setSibuk(true);
    try { await api.masuk(email.trim(), kode); selesai(); } catch (err) { setSalah(pesanGalat(err)); } finally { setSibuk(false); }
  }

  return (
    <section className="login">
      <h1>Emasmu sekarang <em>untung berapa?</em></h1>
      <p>Catat emas yang kamu punya, lihat perkiraan nilainya kalau dijual hari ini, lengkap dengan untung atau ruginya.</p>
      <div className="fitur"><div><b>Rp &amp; %</b>untung atau rugi</div><div><b>Harian</b>harga diperbarui</div><div><b>Pribadi</b>data per akun</div></div>
      {tahap === 'email' ? (
        <form className="kotak" onSubmit={kirimKode} noValidate>
          <label htmlFor="email">Email</label>
          <input className="isian" id="email" type="email" inputMode="email" autoComplete="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {salah && <p className="galat" role="alert">{salah}</p>}
          <button className="tombol t-emas" disabled={sibuk}>{sibuk ? 'Mengirim…' : 'Kirim kode masuk'}</button>
          <p className="kecil">Tanpa password. Kode 6 angka dikirim ke emailmu setiap kali masuk. Dengan masuk, kamu menyetujui <Link to="/privasi">kebijakan privasi</Link>.</p>
        </form>
      ) : (
        <form className="kotak" onSubmit={masuk} noValidate>
          <label htmlFor="kode">Kode 6 angka dari email</label>
          <p className="kecil">Dikirim ke <b>{email}</b>. Cek juga folder Spam/Promosi.</p>
          <input className="isian kode" id="kode" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={kode} onChange={(e) => setKode(e.target.value.replace(/\D/g, ''))} autoFocus />
          {salah && <p className="galat" role="alert">{salah}</p>}
          <button className="tombol t-emas" disabled={sibuk}>{sibuk ? 'Memeriksa…' : 'Masuk'}</button>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="t-teks" onClick={() => { setTahap('email'); setSalah(''); }}>Ganti email</button>
            <button type="button" className="t-teks" disabled={sibuk} onClick={() => kirimKode()}>Kirim ulang kode</button>
          </div>
        </form>
      )}
    </section>
  );
}
