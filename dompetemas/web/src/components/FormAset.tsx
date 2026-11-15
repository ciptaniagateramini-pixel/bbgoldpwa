import { useMemo, useState } from 'react';
import { BENTUK, MEREK, angka, daftarPecahan, formatRibuan, labelKadar, parseBerat, type Aset, type DataHarga, type Merek } from '../lib/hitung';
import { tahunWib } from '../lib/tanggal';
import { Kanvas3D } from './Kanvas3D';
import { Hasil } from './Hasil';

type Props = { harga: DataHarga | null; awal?: Aset; simpan: (a: Aset) => Promise<void>; batal: () => void };

export function FormAset({ harga, awal, simpan, batal }: Props) {
  const thn = tahunWib();
  const [jenis, setJenis] = useState<Aset['jenis']>(awal?.jenis ?? 'batangan');
  const [nama, setNama] = useState(awal?.nama ?? '');
  const [merek, setMerek] = useState<Merek>(awal?.merek ?? 'Antam');
  const [pecahan, setPecahan] = useState(awal?.pecahan ?? '1 g');
  const [keping, setKeping] = useState(String(awal?.keping ?? 1));
  const [bentuk, setBentuk] = useState(awal?.bentuk ?? 'Cincin');
  const [kadar, setKadar] = useState<string | null>(awal?.kadar ?? null);
  const [sub, setSub] = useState<string | null>(awal?.sub ?? null);
  const [berat, setBerat] = useState(awal?.berat ? String(awal.berat).replace('.', ',') : '');
  const [tahun, setTahun] = useState(String(awal?.tahun ?? thn - 1));
  const [beli, setBeli] = useState(awal ? formatRibuan(awal.harga_beli) : '');
  const [salah, setSalah] = useState('');
  const [hasil, setHasil] = useState<Aset | null>(null);
  const [mengirim, setMengirim] = useState(false);

  const items = harga?.perhiasan.items ?? [];
  const kadarList = useMemo(() => { const o: string[] = []; items.forEach((i) => o.includes(i.kadar) || o.push(i.kadar)); return o; }, [items]);
  const subList = kadar ? items.filter((i) => i.kadar === kadar).map((i) => i.jenis) : [];
  const pecahanList = daftarPecahan(harga, merek);

  const pratinjau: Aset = jenis === 'batangan'
    ? { jenis, nama: '', merek, pecahan, keping: 1, bentuk: null, kadar: null, sub: null, berat: null, tahun: 0, harga_beli: 0 }
    : { jenis, nama: '', bentuk, kadar: kadar ?? '750', sub: sub ?? 'Kuning', berat: 1, merek: null, pecahan: null, keping: null, tahun: 0, harga_beli: 0 };

  function ubah<T>(f: (v: T) => void) { return (v: T) => { f(v); setHasil(null); setSalah(''); }; }
  const pilihKadar = ubah((k: string) => { setKadar(k); const j = items.filter((i) => i.kadar === k).map((i) => i.jenis); setSub(j.length === 1 ? j[0] : null); });
  const pilihMerek = ubah((m: Merek) => { setMerek(m); const p = daftarPecahan(harga, m); if (!p.includes(pecahan)) setPecahan(p.includes('1 g') ? '1 g' : p[0]); });

  function rakit(): Aset | null {
    const b = angka(beli);
    const t = Number(tahun);
    if (jenis === 'perhiasan') {
      const g = parseBerat(berat);
      if (!kadar || !sub) { setSalah('Pilih kadar dan jenisnya.'); return null; }
      if (!g) { setSalah('Isi berat emas dalam gram, contoh 3,2.'); return null; }
      if (b < 1000) { setSalah('Isi harga beli totalnya.'); return null; }
      return { id: awal?.id, jenis, nama: nama.trim(), bentuk, kadar, sub, berat: g, merek: null, pecahan: null, keping: null, tahun: t, harga_beli: b };
    }
    const k = Math.floor(Number(keping));
    if (!(k >= 1 && k <= 1000)) { setSalah('Jumlah keping tidak valid.'); return null; }
    if (b < 1000) { setSalah('Isi harga beli totalnya.'); return null; }
    return { id: awal?.id, jenis, nama: nama.trim(), bentuk: null, kadar: null, sub: null, berat: null, merek, pecahan, keping: k, tahun: t, harga_beli: b };
  }

  async function kirim() {
    if (!hasil) return;
    setMengirim(true);
    try { await simpan(hasil); } catch (e) { setSalah(e instanceof Error ? e.message : 'Gagal menyimpan.'); } finally { setMengirim(false); }
  }

  const tahunOpsi = Array.from({ length: thn - 1969 }, (_, i) => thn - i);
  return (
    <>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{awal ? 'Ubah aset emas' : 'Tambah aset emas'}</div>
      <div className="seg" role="group" aria-label="Jenis emas">
        <button type="button" aria-pressed={jenis === 'batangan'} onClick={() => ubah(setJenis)('batangan')}>Logam mulia</button>
        <button type="button" aria-pressed={jenis === 'perhiasan'} onClick={() => ubah(setJenis)('perhiasan')}>Perhiasan</button>
      </div>
      <div className="pratinjau">
        <Kanvas3D aset={pratinjau} />
        <div><b>{jenis === 'batangan' ? `${merek} ${pecahan}` : `${bentuk}${kadar ? ' ' + labelKadar(kadar) : ''}`}</b><div className="kecil">Pratinjau aset</div></div>
      </div>
      <div className="field"><label htmlFor="iNama">Nama (opsional)</label><input className="isian" id="iNama" maxLength={60} placeholder="contoh: Tabungan anak" value={nama} onChange={(e) => setNama(e.target.value)} /></div>
      {jenis === 'batangan' ? (
        <>
          <div className="field"><label>Merek</label><div className="chips">{MEREK.map((m) => <button key={m} type="button" className="chip" aria-pressed={merek === m} onClick={() => pilihMerek(m)}>{m}</button>)}</div></div>
          <div className="field"><label>Pecahan</label><div className="chips">{pecahanList.map((p) => <button key={p} type="button" className="chip" aria-pressed={pecahan === p} onClick={() => ubah(setPecahan)(p)}>{p}</button>)}</div></div>
          <div className="field"><label htmlFor="iKeping">Jumlah keping</label><input className="isian" id="iKeping" inputMode="numeric" value={keping} onChange={(e) => ubah(setKeping)(e.target.value.replace(/\D/g, ''))} /></div>
        </>
      ) : (
        <>
          <div className="field"><label>Bentuk</label><div className="chips">{BENTUK.map((b) => <button key={b} type="button" className="chip" aria-pressed={bentuk === b} onClick={() => ubah(setBentuk)(b)}>{b}</button>)}</div></div>
          <div className="field"><label>Kadar / kode</label><div className="chips">{kadarList.map((k) => <button key={k} type="button" className="chip" aria-pressed={kadar === k} onClick={() => pilihKadar(k)}>{labelKadar(k)}</button>)}</div>
            {!kadarList.length && <p className="kecil">Daftar kadar belum bisa dimuat. Coba muat ulang halaman.</p>}</div>
          {subList.length > 1 && <div className="field"><label>Jenis</label><div className="chips">{subList.map((s) => <button key={s} type="button" className="chip" aria-pressed={sub === s} onClick={() => ubah(setSub)(s)}>{s === 'Lokal' ? 'Lokal (tanpa cap)' : s}</button>)}</div></div>}
          <div className="field"><label htmlFor="iBerat">Berat emas (gram)</label><input className="isian" id="iBerat" inputMode="decimal" placeholder="contoh: 3,2" value={berat} onChange={(e) => ubah(setBerat)(e.target.value)} />
            <p className="kecil">Tanpa berat permata/batu. Kalau ada permata, isi perkiraan berat emasnya saja.</p></div>
        </>
      )}
      <div className="grid2">
        <div><label htmlFor="iTahun">Tahun beli</label><select className="isian" id="iTahun" value={tahun} onChange={(e) => ubah(setTahun)(e.target.value)}>{tahunOpsi.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
        <div><label htmlFor="iBeli">Harga beli total (Rp)</label><input className="isian" id="iBeli" inputMode="numeric" placeholder="2.500.000" value={beli} onChange={(e) => ubah(setBeli)(formatRibuan(angka(e.target.value)))} /></div>
      </div>
      {salah && <p className="galat" role="alert">{salah}</p>}
      {!hasil ? (
        <button className="tombol t-emas" type="button" onClick={() => setHasil(rakit())}>Hitung untung/rugi</button>
      ) : (
        <>
          <Hasil aset={hasil} harga={harga} />
          <button className="tombol t-emas" type="button" disabled={mengirim} onClick={kirim}>{mengirim ? 'Menyimpan…' : awal ? 'Simpan perubahan' : 'Simpan ke dompet'}</button>
        </>
      )}
      <button className="tombol t-kaca" type="button" onClick={batal}>Batal</button>
    </>
  );
}
