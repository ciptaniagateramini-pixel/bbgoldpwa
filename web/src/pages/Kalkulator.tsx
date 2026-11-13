import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useHarga } from '../lib/HargaContext';
import { POLOS, daftarKadar, hitungEstimasi, normalisasiWa, parseBerat, pertanyaanLangkah2 } from '../lib/kalkulator';
import { labelKadar, tanggalJam, tanggalSaja } from '../lib/format';
import { KETERANGAN_BERAT, KETERANGAN_ESTIMASI, KETERANGAN_POLOS, TOKO, waLink } from '../lib/konten';
import { pesanWa, teksEstimasi, type RingkasanHasil } from '../lib/pesan';
import { antreLead, kirimLead, kirimUlangAntrean } from '../lib/api';
import { baca, idAcak, idPerangkat, sumber, tulis } from '../lib/simpan';
import { CatatanWajib } from '../components/CatatanWajib';
import { TombolRute } from '../components/AksiToko';
import { IkonWa } from '../components/Ikon';

const KUNCI_SESI = 'bb_lead_ok';
const KUNCI_HASIL = 'bb_hasil_terakhir';
const CONTOH_CAP_DEFAULT = ['UBS', 'Diamond', 'Lotus', 'HTM'];

type Tahap = 'isi' | 'form' | 'hasil';

function Langkah({ no, judul, children }: { no: number; judul: string; children: React.ReactNode }) {
  return (
    <fieldset className="kartu p-5">
      <legend className="sr-only">{judul}</legend>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-biru text-sm font-bold text-mustard">{no}</span>
        <h2 className="text-lg font-semibold">{judul}</h2>
      </div>
      {children}
    </fieldset>
  );
}

export function Kalkulator() {
  const { memuat, data, berlaku } = useHarga();
  const items = data?.items ?? [];
  const kadarList = useMemo(() => daftarKadar(items), [items]);

  const [kadar, setKadar] = useState<string | null>(null);
  const [jenis, setJenis] = useState<string | null>(null);
  const [beratStr, setBeratStr] = useState('');
  const [permata, setPermata] = useState(false);
  const [tahap, setTahap] = useState<Tahap>('isi');
  const [salah, setSalah] = useState<Record<string, string>>({});
  const [hasil, setHasil] = useState<RingkasanHasil | null>(() => baca<RingkasanHasil>('session', KUNCI_HASIL));
  const [contohCap, setContohCap] = useState(CONTOH_CAP_DEFAULT);

  const [nama, setNama] = useState('');
  const [wa, setWa] = useState('');
  const [email, setEmail] = useState('');
  const [setuju, setSetuju] = useState(false);
  const [jebakan, setJebakan] = useState('');
  const [mengirim, setMengirim] = useState(false);
  const [infoKirim, setInfoKirim] = useState('');
  const idLead = useRef(idAcak());
  const atasHasil = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasil) setTahap('hasil');
    fetch('/config/cap-pabrik.json')
      .then((r) => r.json())
      .then((j) => Array.isArray(j.contohMerek) && j.contohMerek.length && setContohCap(j.contohMerek.map(String)))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tahap !== 'isi') atasHasil.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [tahap]);

  const q2 = kadar && kadar !== POLOS ? pertanyaanLangkah2(items, kadar) : null;
  const jenisFinal = kadar === POLOS ? 'Lokal' : q2?.tipe === 'lewati' ? q2.jenis : jenis;
  const berat = parseBerat(beratStr);

  function pilihKadar(k: string) {
    setKadar(k);
    setJenis(null);
    setSalah({});
  }

  function jenisTampil(): string {
    if (kadar === POLOS) return 'Tidak ada cap (polos)';
    if (!q2 || !jenisFinal) return '';
    if (q2.tipe === 'cap') return jenisFinal === q2.capPabrik ? 'Ada cap pabrik' : 'Tidak ada cap (Lokal)';
    if (q2.tipe === 'warna') return `Emas ${jenisFinal.toLowerCase()}`;
    return jenisFinal === '-' ? '-' : jenisFinal;
  }

  function buatHasil(): RingkasanHasil | null {
    if (!kadar || !jenisFinal || !berat || !data?.ditetapkanPada) return null;
    const e = hitungEstimasi(items, kadar, jenisFinal, berat);
    if (!e) return null;
    return { kadar, jenis: jenisFinal, jenisTampil: jenisTampil(), berat, permata, estimasi: e, ditetapkanPada: data.ditetapkanPada };
  }

  function tampilkanHasil(h: RingkasanHasil) {
    setHasil(h);
    tulis('session', KUNCI_HASIL, h);
    setTahap('hasil');
  }

  function lihatEstimasi() {
    const s: Record<string, string> = {};
    if (!kadar) s.kadar = 'Pilih kode perhiasan dulu.';
    else if (!jenisFinal) s.jenis = 'Pilih salah satu jawaban.';
    if (!berat) s.berat = 'Isi berat dalam gram, contoh 3,5 (maksimal 1000 gram).';
    setSalah(s);
    if (Object.keys(s).length) return;
    const h = buatHasil();
    if (!h) return;
    if (baca<boolean>('session', KUNCI_SESI)) tampilkanHasil(h);
    else setTahap('form');
  }

  async function kirim(ev: FormEvent) {
    ev.preventDefault();
    const s: Record<string, string> = {};
    const waNorm = normalisasiWa(wa);
    if (nama.trim().length < 2) s.nama = 'Isi nama kamu.';
    if (!waNorm) s.wa = 'Nomor WhatsApp tidak valid. Contoh: 0812-3456-7890.';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) s.email = 'Format email tidak valid (boleh dikosongkan).';
    if (!setuju) s.setuju = 'Centang persetujuan untuk melanjutkan.';
    setSalah(s);
    if (Object.keys(s).length) return;
    const h = buatHasil();
    if (!h) return;

    setMengirim(true);
    const k = {
      id: idLead.current,
      perangkat: idPerangkat(),
      nama: nama.trim(),
      wa: waNorm!,
      email: email.trim(),
      setuju,
      website: jebakan,
      kadar: kadar === POLOS ? '' : kadar!,
      jenis: kadar === POLOS ? '' : jenisFinal!,
      polos: kadar === POLOS,
      berat: berat!,
      permata,
      sumber: sumber(),
    };
    const r = await kirimLead(k);
    setMengirim(false);
    if (r.status === 'validasi') {
      setSalah(r.kolom);
      return;
    }
    if (r.status === 'gagal') {
      antreLead(k);
      void kirimUlangAntrean(5000);
      setInfoKirim('Koneksi sedang bermasalah. Kontak kamu akan dikirim ulang otomatis, hasil tetap bisa dilihat.');
    }
    tulis('session', KUNCI_SESI, true);
    idLead.current = idAcak();
    tampilkanHasil(h);
  }

  function hitungLagi() {
    setTahap('isi');
    setKadar(null);
    setJenis(null);
    setBeratStr('');
    setPermata(false);
    setInfoKirim('');
  }

  // ----- tampilan -----
  if (memuat) return <div className="kartu h-72 animate-pulse" aria-label="Memuat" />;

  const nonaktif = !data || !berlaku;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Kalkulator estimasi buyback perhiasan</h1>
        <p className="mt-1 text-sm text-krem/80">Jawab beberapa pertanyaan singkat untuk melihat estimasi nilai perhiasan kamu di BB GOLD.</p>
      </div>

      {nonaktif && tahap !== 'hasil' && (
        <div role="alert" data-testid="kalkulator-nonaktif" className="rounded-2xl border-2 border-mustard bg-biru-2 px-4 py-4">
          <p className="font-semibold text-mustard">Harga hari ini belum ditetapkan</p>
          <p className="mt-1 text-sm text-krem/85">Kalkulator aktif kembali setelah harga hari ini ditetapkan. Kamu bisa menanyakan harga lewat WhatsApp toko.</p>
          <a href={waLink('Halo BB GOLD, saya mau tanya harga buyback perhiasan hari ini.')} target="_blank" rel="noopener" className="tombol-mustard mt-3"><IkonWa /> Tanya lewat WhatsApp</a>
        </div>
      )}

      {tahap === 'isi' && !nonaktif && (
        <div className="space-y-4">
          <Langkah no={1} judul="Kode perhiasan">
            <p className="mb-3 text-sm text-abu-biru">Cek bagian dalam cincin, belakang liontin, atau dekat kait kalung. Ada angka kodenya?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Pilih kode">
              {kadarList.map((k) => (
                <button key={k} type="button" className="chip" aria-pressed={kadar === k} onClick={() => pilihKadar(k)}>{labelKadar(k)}</button>
              ))}
              <button type="button" className="chip col-span-2 sm:col-span-3" aria-pressed={kadar === POLOS} onClick={() => pilihKadar(POLOS)}>Tidak ada kode (polos)</button>
            </div>
            {salah.kadar && <p className="mt-2 text-sm font-medium text-red-700">{salah.kadar}</p>}
            {kadar === POLOS && <p className="mt-3 rounded-xl bg-mustard-muda/60 px-3 py-2 text-sm">{KETERANGAN_POLOS}</p>}
          </Langkah>

          {q2 && q2.tipe !== 'lewati' && (
            <Langkah no={2} judul={q2.tipe === 'cap' ? 'Ada cap pabrik?' : q2.tipe === 'warna' ? 'Warna emasnya apa?' : 'Pilih jenisnya'}>
              {q2.tipe === 'cap' && (
                <>
                  <p className="mb-3 text-sm text-abu-biru">Cap pabrik adalah tanda merek pabrik yang tercetak di perhiasan, misalnya {contohCap.join(', ')}, dan lainnya.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="chip" aria-pressed={jenis === q2.capPabrik} onClick={() => setJenis(q2.capPabrik)}>Ada cap pabrik</button>
                    <button type="button" className="chip" aria-pressed={jenis === q2.lokal} onClick={() => setJenis(q2.lokal)}>Tidak ada cap</button>
                  </div>
                </>
              )}
              {q2.tipe !== 'cap' && (
                <div className="grid grid-cols-2 gap-2">
                  {q2.pilihan.map((p) => (
                    <button key={p} type="button" className="chip" aria-pressed={jenis === p} onClick={() => setJenis(p)}>{q2.tipe === 'warna' ? `Emas ${p.toLowerCase()}` : p}</button>
                  ))}
                </div>
              )}
              {salah.jenis && <p className="mt-2 text-sm font-medium text-red-700">{salah.jenis}</p>}
            </Langkah>
          )}

          <Langkah no={q2 && q2.tipe !== 'lewati' ? 3 : 2} judul="Berat dan permata">
            <label htmlFor="berat" className="mb-1 block text-sm font-medium">Berat perhiasan (gram)</label>
            <div className="flex items-center gap-2">
              <input id="berat" inputMode="decimal" autoComplete="off" placeholder="contoh: 3,5" className="isian" value={beratStr} onChange={(e) => setBeratStr(e.target.value)} aria-invalid={!!salah.berat} aria-describedby="ket-berat" />
              <span className="font-semibold">gram</span>
            </div>
            {salah.berat && <p className="mt-1 text-sm font-medium text-red-700">{salah.berat}</p>}
            <p id="ket-berat" data-testid="ket-berat" className={`mt-3 rounded-xl px-3 py-2 text-sm ${permata ? 'border-2 border-biru bg-mustard-muda font-semibold' : 'bg-biru/5 text-abu-biru'}`}>{KETERANGAN_BERAT}</p>
            <label className="mt-3 flex min-h-[48px] cursor-pointer items-center gap-3">
              <input type="checkbox" className="h-6 w-6 accent-biru" checked={permata} onChange={(e) => setPermata(e.target.checked)} />
              <span>Perhiasan ini ada permata/batu/aksesoris</span>
            </label>
          </Langkah>

          <button type="button" className="tombol-mustard w-full text-lg" onClick={lihatEstimasi}>Lihat estimasi</button>
        </div>
      )}

      <div ref={atasHasil} />

      {tahap === 'form' && (
        <form onSubmit={kirim} noValidate className="kartu space-y-4 p-5" data-testid="form-kontak">
          <div>
            <h2 className="text-lg font-semibold">Satu langkah lagi</h2>
            <p className="text-sm text-abu-biru">Isi kontak kamu untuk melihat estimasi. Toko bisa menindaklanjuti estimasi ini lewat WhatsApp.</p>
          </div>
          <div>
            <label htmlFor="nama" className="mb-1 block text-sm font-medium">Nama <span aria-hidden="true">*</span></label>
            <input id="nama" autoComplete="name" className="isian" value={nama} onChange={(e) => setNama(e.target.value)} aria-invalid={!!salah.nama} required />
            {salah.nama && <p className="mt-1 text-sm font-medium text-red-700">{salah.nama}</p>}
          </div>
          <div>
            <label htmlFor="wa" className="mb-1 block text-sm font-medium">Nomor WhatsApp <span aria-hidden="true">*</span></label>
            <input id="wa" type="tel" inputMode="tel" autoComplete="tel" placeholder="0812-3456-7890" className="isian" value={wa} onChange={(e) => setWa(e.target.value)} aria-invalid={!!salah.wa} required />
            {salah.wa && <p className="mt-1 text-sm font-medium text-red-700">{salah.wa}</p>}
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">Email (opsional)</label>
            <input id="email" type="email" autoComplete="email" className="isian" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!salah.email} />
            {salah.email && <p className="mt-1 text-sm font-medium text-red-700">{salah.email}</p>}
          </div>
          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" value={jebakan} onChange={(e) => setJebakan(e.target.value)} />
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-biru" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
            <span className="text-sm">Saya setuju nama dan nomor WhatsApp saya dipakai BB GOLD untuk menindaklanjuti estimasi yang saya minta. <Link to="/privasi" className="underline" target="_blank">Kebijakan privasi</Link></span>
          </label>
          {salah.setuju && <p className="text-sm font-medium text-red-700">{salah.setuju}</p>}
          {salah.kode || salah.berat ? <p className="text-sm font-medium text-red-700">{salah.kode || salah.berat}</p> : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" className="tombol-biru flex-1" disabled={mengirim}>{mengirim ? 'Mengirim…' : 'Kirim dan lihat estimasi'}</button>
            <button type="button" className="tombol border-2 border-biru/30 text-biru" onClick={() => setTahap('isi')}>Kembali</button>
          </div>
        </form>
      )}

      {tahap === 'hasil' && hasil && <KartuHasil h={hasil} info={infoKirim} onUlang={hitungLagi} bisaUlang={!nonaktif} />}
    </div>
  );
}

function KartuHasil({ h, info, onUlang, bisaUlang }: { h: RingkasanHasil; info: string; onUlang: () => void; bisaUlang: boolean }) {
  const tgl = tanggalSaja(h.ditetapkanPada);
  return (
    <section className="space-y-4" aria-labelledby="judul-hasil" data-testid="hasil">
      {info && <p role="status" className="rounded-xl bg-biru-2 px-4 py-2 text-sm text-mustard-muda">{info}</p>}
      <div className="kartu relative overflow-hidden p-5" data-testid="kartu-hasil">
        <div className="watermark" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => <span key={i}>ESTIMASI · {tgl}</span>)}
        </div>
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-abu-biru">Estimasi · {tgl}</p>
          <h2 id="judul-hasil" className="mt-1 text-xl font-semibold">Estimasi nilai perhiasan kamu</h2>
          <p className="mt-3 text-3xl font-bold tabular-nums sm:text-4xl" data-testid="angka-estimasi">{teksEstimasi(h.estimasi)}</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-abu-biru">Kode</dt><dd className="font-medium">{h.kadar === POLOS ? 'Tidak ada kode (polos)' : labelKadar(h.kadar)}</dd>
            <dt className="text-abu-biru">Cap/jenis</dt><dd className="font-medium">{h.jenisTampil}</dd>
            <dt className="text-abu-biru">Berat emas</dt><dd className="font-medium">{h.berat.toLocaleString('id-ID')} gram</dd>
            <dt className="text-abu-biru">Permata/aksesoris</dt><dd className="font-medium">{h.permata ? 'Ya' : 'Tidak'}</dd>
          </dl>
          {h.kadar === POLOS && <p className="mt-3 rounded-xl bg-mustard-muda/70 px-3 py-2 text-sm font-medium">{KETERANGAN_POLOS}</p>}
          <p className="mt-3 text-xs text-abu-biru" data-testid="cap-waktu-hasil">Berdasarkan harga yang ditetapkan {tanggalJam(h.ditetapkanPada)}</p>
        </div>
      </div>

      <CatatanWajib />
      <p className="text-sm text-krem/90" data-testid="keterangan-estimasi">{KETERANGAN_ESTIMASI}</p>
      {h.permata && <p className="text-sm text-krem/90">{KETERANGAN_BERAT}</p>}

      <div className="rounded-2xl bg-biru-2 p-5">
        <p className="font-semibold text-mustard-muda">Bawa perhiasanmu ke toko untuk dicek langsung, buka setiap hari 09.00 - 17.00 WIB.</p>
        <p className="mt-1 text-sm text-krem/85">{TOKO.alamat}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a href={waLink(pesanWa(h))} target="_blank" rel="noopener" className="tombol-mustard" data-testid="tombol-wa-hasil"><IkonWa /> Kirim ke WhatsApp toko</a>
          <TombolRute />
        </div>
      </div>
      {bisaUlang && <button type="button" className="tombol-garis w-full" onClick={onUlang}>Hitung perhiasan lain</button>}
    </section>
  );
}
