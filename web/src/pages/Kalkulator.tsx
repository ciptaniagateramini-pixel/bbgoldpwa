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
import { BibiBicara } from '../components/Bibi';
import { IkonWa } from '../components/Ikon';

const KUNCI_SESI = 'bb_lead_ok';
const KUNCI_HASIL = 'bb_hasil_terakhir';
const CONTOH_CAP_DEFAULT = ['UBS', 'Diamond', 'Lotus', 'HTM'];

type Layar = 'kode' | 'cap' | 'berat' | 'kontak' | 'hasil';
const URUTAN: Layar[] = ['kode', 'cap', 'berat', 'kontak', 'hasil'];

function konfeti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const k = document.createElement('div');
  k.className = 'konfeti';
  k.setAttribute('aria-hidden', 'true');
  const warna = ['#E5B527', '#F6DC7A', '#FBF7EC', '#C99712'];
  for (let i = 0; i < 36; i++) {
    const c = document.createElement('i');
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = warna[i % 4];
    c.style.animationDelay = `${Math.random() * 0.5}s`;
    c.style.animationDuration = `${1.4 + Math.random()}s`;
    k.appendChild(c);
  }
  document.body.appendChild(k);
  setTimeout(() => k.remove(), 2800);
}

export function Kalkulator() {
  const { memuat, data, berlaku } = useHarga();
  const items = data?.items ?? [];
  const kadarList = useMemo(() => daftarKadar(items), [items]);

  const [layar, setLayar] = useState<Layar>(() => (baca<RingkasanHasil>('session', KUNCI_HASIL) ? 'hasil' : 'kode'));
  const [mundur, setMundur] = useState(false);
  const riwayat = useRef<Layar[]>([]);
  const [kadar, setKadar] = useState<string | null>(null);
  const [jenis, setJenis] = useState<string | null>(null);
  const [beratStr, setBeratStr] = useState('');
  const [permata, setPermata] = useState(false);
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

  useEffect(() => {
    fetch('/config/cap-pabrik.json')
      .then((r) => r.json())
      .then((j) => Array.isArray(j.contohMerek) && j.contohMerek.length && setContohCap(j.contohMerek.map(String)))
      .catch(() => {});
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [layar]);

  const q2 = kadar && kadar !== POLOS ? pertanyaanLangkah2(items, kadar) : null;
  const jenisFinal = kadar === POLOS ? 'Lokal' : q2?.tipe === 'lewati' ? q2.jenis : jenis;
  const berat = parseBerat(beratStr);

  function ke(l: Layar) {
    riwayat.current.push(layar);
    setMundur(false);
    setSalah({});
    setLayar(l);
  }
  function kembali() {
    const prev = riwayat.current.pop();
    if (!prev) return;
    setMundur(true);
    setSalah({});
    setLayar(prev === 'kontak' && layar === 'hasil' ? 'berat' : prev);
  }

  function pilihKadar(k: string) {
    setKadar(k);
    setJenis(null);
    if (k === POLOS) return ke('berat');
    const q = pertanyaanLangkah2(items, k);
    ke(q.tipe === 'lewati' ? 'berat' : 'cap');
  }
  function pilihJenis(j: string) {
    setJenis(j);
    ke('berat');
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
    ke('hasil');
    konfeti();
  }

  function lihatEstimasi() {
    if (!berat) {
      setSalah({ berat: 'Isi berat dalam gram, contoh 3,5 (maksimal 1000 gram).' });
      return;
    }
    const h = buatHasil();
    if (!h) return;
    if (baca<boolean>('session', KUNCI_SESI)) tampilkanHasil(h);
    else ke('kontak');
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
    riwayat.current = [];
    setKadar(null);
    setJenis(null);
    setBeratStr('');
    setPermata(false);
    setInfoKirim('');
    setMundur(true);
    setLayar('kode');
  }

  if (memuat) return <div className="kartu h-72 animate-pulse" aria-label="Memuat" />;

  const nonaktif = !data || !berlaku;
  const langkahKe = URUTAN.indexOf(layar) + 1;

  if (nonaktif && layar !== 'hasil') {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold">Kalkulator estimasi buyback perhiasan</h1>
        <BibiBicara judul="Harga hari ini belum ditetapkan" pose="berpikir">Kalkulator aktif kembali setelah harga hari ini ditetapkan.</BibiBicara>
        <div role="alert" data-testid="kalkulator-nonaktif" className="rounded-2xl border-2 border-mustard bg-biru-2 px-4 py-4">
          <p className="text-sm text-krem/85">Sambil menunggu, kamu bisa menanyakan harga lewat WhatsApp toko.</p>
          <a href={waLink('Halo BB GOLD, saya mau tanya harga buyback perhiasan hari ini.')} target="_blank" rel="noopener" className="tombol-mustard mt-3"><IkonWa /> Tanya lewat WhatsApp</a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-[env(safe-area-inset-top)] z-10 -mx-4 flex items-center gap-2.5 bg-biru/95 px-4 py-2 backdrop-blur">
        {riwayat.current.length > 0 && layar !== 'hasil' ? (
          <button type="button" onClick={kembali} aria-label="Kembali" className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-xl">‹</button>
        ) : (
          <Link to="/" aria-label="Ke beranda" className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-xl">×</Link>
        )}
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <i className="block h-full rounded-full bg-mustard transition-[width] duration-300" style={{ width: `${(langkahKe / URUTAN.length) * 100}%` }} />
        </div>
        <span className="w-10 text-right text-xs text-krem/60">{Math.min(langkahKe, 4)}/4</span>
      </div>
      <h1 className="sr-only">Kalkulator estimasi buyback perhiasan</h1>

      <div key={layar} className={`layar-kuis mt-3 ${mundur ? 'mundur' : ''}`}>
        {layar === 'kode' && (
          <div className="space-y-4">
            <BibiBicara judul="Ada angka kode di perhiasanmu?" pose="periksa" judulTag="h2">
              Cek bagian dalam cincin, belakang liontin, atau dekat kait kalung. Ada angka kodenya?
            </BibiBicara>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Pilih kode">
              {kadarList.map((k) => (
                <button key={k} type="button" className="chip-kuis" aria-pressed={kadar === k} onClick={() => pilihKadar(k)}>{labelKadar(k)}</button>
              ))}
              <button type="button" className="chip-kuis col-span-3" aria-pressed={kadar === POLOS} onClick={() => pilihKadar(POLOS)}>Tidak ada kode (polos)</button>
            </div>
          </div>
        )}

        {layar === 'cap' && q2 && q2.tipe !== 'lewati' && (
          <div className="space-y-4">
            {q2.tipe === 'cap' && (
              <>
                <BibiBicara judul="Ada cap pabrik?" pose="berpikir" judulTag="h2">
                  Cap pabrik adalah tanda merek pabrik yang tercetak di perhiasan, misalnya {contohCap.join(', ')}, dan lainnya.
                </BibiBicara>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="chip-kuis" aria-pressed={jenis === q2.capPabrik} onClick={() => pilihJenis(q2.capPabrik)}>Ada cap pabrik</button>
                  <button type="button" className="chip-kuis" aria-pressed={jenis === q2.lokal} onClick={() => pilihJenis(q2.lokal)}>Tidak ada cap</button>
                </div>
              </>
            )}
            {q2.tipe !== 'cap' && (
              <>
                <BibiBicara judul={q2.tipe === 'warna' ? 'Warna emasnya apa?' : 'Pilih jenisnya'} pose="berpikir" judulTag="h2">Pilih yang paling mirip.</BibiBicara>
                <div className="grid grid-cols-2 gap-2">
                  {q2.pilihan.map((p) => (
                    <button key={p} type="button" className="chip-kuis" aria-pressed={jenis === p} onClick={() => pilihJenis(p)}>{q2.tipe === 'warna' ? `Emas ${p.toLowerCase()}` : p}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {layar === 'berat' && (
          <div className="space-y-3">
            <BibiBicara judul="Berapa beratnya?" pose="checklist" judulTag="h2">
              {kadar === POLOS ? KETERANGAN_POLOS : `${kadar ? labelKadar(kadar) : ''}${jenisTampil() && jenisTampil() !== '-' ? ' · ' + jenisTampil() : ''}`}
            </BibiBicara>
            <label htmlFor="berat" className="block text-[13px] font-semibold text-krem/75">Berat perhiasan (gram)</label>
            <input id="berat" inputMode="decimal" autoComplete="off" placeholder="contoh: 3,5" className="isian-kuis" value={beratStr} onChange={(e) => setBeratStr(e.target.value)} aria-invalid={!!salah.berat} aria-describedby="ket-berat" />
            {salah.berat && <p className="text-sm font-medium text-[#FFB4A8]">{salah.berat}</p>}
            <label className="flex min-h-[48px] cursor-pointer items-center gap-3">
              <input type="checkbox" className="h-6 w-6 accent-mustard" checked={permata} onChange={(e) => setPermata(e.target.checked)} />
              <span>Perhiasan ini ada permata/batu/aksesoris</span>
            </label>
            <p id="ket-berat" data-testid="ket-berat" className={`rounded-xl px-3 py-2.5 text-[13px] ${permata ? 'border-2 border-mustard bg-mustard-muda font-semibold text-biru' : 'border border-mustard/40 bg-mustard/10 text-mustard-muda'}`}>{KETERANGAN_BERAT}</p>
            <button type="button" className="tombol-mustard mt-2 w-full text-lg" onClick={lihatEstimasi}>Lihat estimasi</button>
          </div>
        )}

        {layar === 'kontak' && (
          <form onSubmit={kirim} noValidate className="space-y-3" data-testid="form-kontak">
            <BibiBicara judul="Satu langkah lagi!" pose="jempol" judulTag="h2">Isi kontakmu supaya toko bisa bantu cek estimasi ini lewat WhatsApp.</BibiBicara>
            <div>
              <label htmlFor="nama" className="mb-1 block text-[13px] font-semibold text-krem/75">Nama</label>
              <input id="nama" autoComplete="name" className="isian-kuis" value={nama} onChange={(e) => setNama(e.target.value)} aria-invalid={!!salah.nama} required />
              {salah.nama && <p className="mt-1 text-sm font-medium text-[#FFB4A8]">{salah.nama}</p>}
            </div>
            <div>
              <label htmlFor="wa" className="mb-1 block text-[13px] font-semibold text-krem/75">Nomor WhatsApp</label>
              <input id="wa" type="tel" inputMode="tel" autoComplete="tel" placeholder="0812-3456-7890" className="isian-kuis" value={wa} onChange={(e) => setWa(e.target.value)} aria-invalid={!!salah.wa} required />
              {salah.wa && <p className="mt-1 text-sm font-medium text-[#FFB4A8]">{salah.wa}</p>}
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-[13px] font-semibold text-krem/75">Email (opsional)</label>
              <input id="email" type="email" autoComplete="email" className="isian-kuis" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!salah.email} />
              {salah.email && <p className="mt-1 text-sm font-medium text-[#FFB4A8]">{salah.email}</p>}
            </div>
            <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" value={jebakan} onChange={(e) => setJebakan(e.target.value)} />
            </div>
            <label className="flex cursor-pointer items-start gap-3 pt-1">
              <input type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-mustard" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
              <span className="text-sm">Saya setuju nama dan nomor WhatsApp saya dipakai BB GOLD untuk menindaklanjuti estimasi yang saya minta. <Link to="/privasi" className="underline" target="_blank">Kebijakan privasi</Link></span>
            </label>
            {salah.setuju && <p className="text-sm font-medium text-[#FFB4A8]">{salah.setuju}</p>}
            {salah.kode || salah.berat ? <p className="text-sm font-medium text-[#FFB4A8]">{salah.kode || salah.berat}</p> : null}
            <button type="submit" className="tombol-mustard mt-2 w-full text-lg" disabled={mengirim}>{mengirim ? 'Mengirim…' : 'Kirim dan lihat estimasi'}</button>
          </form>
        )}

        {layar === 'hasil' && hasil && <KartuHasil h={hasil} info={infoKirim} onUlang={hitungLagi} bisaUlang={!nonaktif} />}
      </div>
    </div>
  );
}

function KartuHasil({ h, info, onUlang, bisaUlang }: { h: RingkasanHasil; info: string; onUlang: () => void; bisaUlang: boolean }) {
  const tgl = tanggalSaja(h.ditetapkanPada);
  return (
    <section className="space-y-4" aria-labelledby="judul-hasil" data-testid="hasil">
      <BibiBicara judul="Ini estimasinya!" pose="semangat">Bawa perhiasanmu ke toko untuk dicek langsung.</BibiBicara>
      {info && <p role="status" className="rounded-xl bg-biru-2 px-4 py-2 text-sm text-mustard-muda">{info}</p>}
      <div className="kartu relative overflow-hidden rounded-3xl p-5" data-testid="kartu-hasil">
        <div className="watermark" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => <span key={i}>ESTIMASI · {tgl}</span>)}
        </div>
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-abu-biru">Estimasi · {tgl}</p>
          <h2 id="judul-hasil" className="mt-1 text-lg font-bold">Estimasi nilai perhiasan kamu</h2>
          <p className="mt-2 text-[32px] font-extrabold leading-tight tabular-nums" data-testid="angka-estimasi">{teksEstimasi(h.estimasi)}</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
            <dt className="text-abu-biru">Kode</dt><dd className="text-right font-semibold">{h.kadar === POLOS ? 'Tidak ada kode (polos)' : labelKadar(h.kadar)}</dd>
            <dt className="text-abu-biru">Cap/jenis</dt><dd className="text-right font-semibold">{h.jenisTampil}</dd>
            <dt className="text-abu-biru">Berat emas</dt><dd className="text-right font-semibold">{h.berat.toLocaleString('id-ID')} gram</dd>
            <dt className="text-abu-biru">Permata/aksesoris</dt><dd className="text-right font-semibold">{h.permata ? 'Ya' : 'Tidak'}</dd>
          </dl>
          {h.kadar === POLOS && <p className="mt-3 rounded-xl bg-mustard-muda/70 px-3 py-2 text-sm font-medium">{KETERANGAN_POLOS}</p>}
          <p className="mt-3 text-[11px] text-abu-biru" data-testid="cap-waktu-hasil">Berdasarkan harga yang ditetapkan {tanggalJam(h.ditetapkanPada)}</p>
        </div>
      </div>

      <CatatanWajib />
      <p className="text-[13px] text-krem/85" data-testid="keterangan-estimasi">{KETERANGAN_ESTIMASI}</p>
      {h.permata && <p className="text-[13px] text-krem/85">{KETERANGAN_BERAT}</p>}

      <div className="rounded-3xl bg-biru-2 p-5">
        <p className="font-semibold text-mustard-muda">Bawa perhiasanmu ke toko untuk dicek langsung, buka setiap hari 09.00 - 17.00 WIB.</p>
        <p className="mt-1 text-[13px] text-krem/80">{TOKO.alamat}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a href={waLink(pesanWa(h))} target="_blank" rel="noopener" className="tombol-mustard" data-testid="tombol-wa-hasil"><IkonWa /> Kirim ke WhatsApp toko</a>
          <TombolRute />
        </div>
      </div>
      {bisaUlang && <button type="button" className="tombol-garis w-full" onClick={onUlang}>Hitung perhiasan lain</button>}
    </section>
  );
}
