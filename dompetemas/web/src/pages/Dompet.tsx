import { useCallback, useEffect, useState } from 'react';
import { analisis, beratEmas, koma, ketAset, namaAset, persen, rp, type Aset, type DataHarga } from '../lib/hitung';
import { api, pesanGalat } from '../lib/api';
import { tahunWib, tanggalId } from '../lib/tanggal';
import { Kanvas3D } from '../components/Kanvas3D';
import { Lembar } from '../components/Lembar';
import { Hasil } from '../components/Hasil';
import { FormAset } from '../components/FormAset';

export function Dompet({ harga, formBuka, setFormBuka }: { harga: DataHarga | null; formBuka: boolean; setFormBuka: (b: boolean) => void }) {
  const [aset, setAset] = useState<Aset[] | null>(null);
  const [salah, setSalah] = useState('');
  const [detail, setDetail] = useState<Aset | null>(null);
  const [ubah, setUbah] = useState<Aset | null>(null);
  const [yakinHapus, setYakinHapus] = useState(false);

  const muat = useCallback(() => { api.aset().then(setAset).catch((e) => setSalah(pesanGalat(e))); }, []);
  useEffect(muat, [muat]);

  const thn = tahunWib();
  let tN = 0, tM = 0, tG = 0, lengkap = true;
  (aset ?? []).forEach((a) => { const h = analisis(a, harga, thn); if (h.nilai === null) lengkap = false; tN += h.nilai ?? 0; tM += a.harga_beli; tG += beratEmas(a); });
  const s = tN - tM, naik = s >= 0;

  async function simpan(a: Aset) {
    const baru = await api.simpan(a).catch((e) => { throw new Error(pesanGalat(e)); });
    setAset((l) => (a.id ? (l ?? []).map((x) => (x.id === baru.id ? baru : x)) : [baru, ...(l ?? [])]));
    setFormBuka(false); setUbah(null); setDetail(null);
    scrollTo(0, 0);
  }
  async function hapus(a: Aset) {
    try { await api.hapus(a.id!); setAset((l) => (l ?? []).filter((x) => x.id !== a.id)); setDetail(null); setYakinHapus(false); }
    catch (e) { setSalah(pesanGalat(e)); }
  }
  const tutupForm = useCallback(() => { setFormBuka(false); setUbah(null); }, [setFormBuka]);
  const tutupDetail = useCallback(() => { setDetail(null); setYakinHapus(false); }, []);

  return (
    <section>
      <div className="total">
        <div className="lab">Total aset emas · jika dijual hari ini</div>
        <div className="nilai" data-testid="total-nilai">{aset ? `± ${rp(tN)}` : '…'}</div>
        {aset && aset.length > 0 && <span className={`pil ${naik ? 'naik' : 'turun'}`} data-testid="total-untung">{naik ? '▲ +' : '▼ '}{rp(s)} ({persen(tM ? s / tM : 0)})</span>}
        <div className="statistik">
          <div><small>Modal beli</small><b>{rp(tM)}</b></div>
          <div><small>Total berat</small><b>{koma(tG)} g</b></div>
          <div><small>Jumlah aset</small><b>{aset?.length ?? 0} aset</b></div>
        </div>
      </div>
      <p className="sumber">Harga referensi: <b>BB GOLD Purwakarta</b> (perhiasan, per {tanggalId(harga?.perhiasan.ditetapkanPada)}) dan buyback resmi Antam, UBS, Hartadinata (batangan). Harga di toko lain bisa berbeda.{!lengkap && ' Sebagian aset belum punya harga referensi.'}</p>
      {!harga && <p className="info">Harga referensi belum bisa dimuat. Nilai hari ini akan muncul setelah harga tersedia.</p>}
      {salah && <p className="galat" role="alert">{salah}</p>}
      <h2>Aset emas saya <button className="t-teks" type="button" onClick={() => setFormBuka(true)}>+ Tambah</button></h2>
      <div className="daftar" data-testid="daftar">
        {!aset && <><div className="memuat" /><div className="memuat" /></>}
        {aset && aset.length === 0 && (
          <div className="kosong"><b>Dompetmu masih kosong</b><span>Tambahkan emas pertamamu untuk melihat perkiraan untung atau ruginya hari ini.</span><button className="tombol t-emas" type="button" onClick={() => setFormBuka(true)}>Tambah emas</button></div>
        )}
        {aset?.map((a, i) => {
          const h = analisis(a, harga, thn);
          const n = (h.selisih ?? 0) >= 0;
          return (
            <button key={a.id} type="button" className={`kartu ${a.jenis}`} onClick={() => setDetail(a)} data-testid="kartu-aset">
              <div style={{ position: 'relative', minWidth: 0 }}>
                <div className="jenis">{a.jenis === 'batangan' ? `Logam mulia · ${a.merek}` : `Perhiasan · ${a.bentuk}`}</div>
                <div className="nama">{namaAset(a)}</div>
                <div className="ket">{ketAset(a)}</div>
                <div className="nilai">{h.nilai !== null ? `± ${rp(h.nilai)}` : 'Harga belum ada'}</div>
                {h.selisih !== null && h.persen !== null && (
                  <div className="bawah"><span className={`pil ${n ? 'naik' : 'turun'}`}>{n ? '▲ ' : '▼ '}{persen(h.persen)}</span><span style={{ color: n ? 'var(--naik)' : 'var(--turun)', fontWeight: 700 }}>{n ? '+' : ''}{rp(h.selisih)}</span></div>
                )}
              </div>
              <Kanvas3D aset={a} fase={i * 1.7} />
            </button>
          );
        })}
      </div>

      <Lembar buka={!!detail && !ubah} tutup={tutupDetail} judul="Detail aset">
        {detail && (
          <>
            <Kanvas3D aset={detail} className="besar" />
            <div style={{ textAlign: 'center' }}>
              <div className="kecil">{detail.jenis === 'batangan' ? `Logam mulia · ${detail.merek}` : `Perhiasan · ${detail.bentuk}`}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{namaAset(detail)}</div>
              <div className="kecil">{ketAset(detail)}</div>
            </div>
            <Hasil aset={detail} harga={harga} />
            <div className="grid2">
              <button className="tombol t-kaca" type="button" onClick={() => setUbah(detail)}>Ubah</button>
              <button className="tombol t-bahaya" type="button" onClick={() => setYakinHapus(true)}>Hapus</button>
            </div>
            {yakinHapus && (
              <div className="kotak" role="alertdialog">
                <b>Hapus &quot;{namaAset(detail)}&quot; dari dompet?</b>
                <div className="grid2"><button className="tombol t-kaca" type="button" onClick={() => setYakinHapus(false)}>Batal</button><button className="tombol t-bahaya" type="button" onClick={() => hapus(detail)}>Ya, hapus</button></div>
              </div>
            )}
            <button className="tombol t-kaca" type="button" onClick={tutupDetail}>Tutup</button>
          </>
        )}
      </Lembar>
      <Lembar buka={formBuka || !!ubah} tutup={tutupForm} judul="Form aset">
        <FormAset key={ubah?.id ?? 'baru'} harga={harga} awal={ubah ?? undefined} simpan={simpan} batal={tutupForm} />
      </Lembar>
    </section>
  );
}
