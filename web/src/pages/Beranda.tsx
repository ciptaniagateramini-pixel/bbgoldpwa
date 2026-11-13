import { Link } from 'react-router-dom';
import { TabelHarga } from '../components/TabelHarga';
import { GrafikEmas } from '../components/GrafikEmas';
import { Referensi } from '../components/Referensi';
import { TombolRute, TombolWa } from '../components/AksiToko';
import { Bibi, BibiBicara } from '../components/Bibi';
import { useHarga } from '../lib/HargaContext';
import { bagianWib, sekarang } from '../lib/waktu';
import { TOKO } from '../lib/konten';

function salam(): string {
  const jam = Math.floor(bagianWib(sekarang()).menit / 60);
  return jam < 11 ? 'Selamat pagi!' : jam < 15 ? 'Selamat siang!' : jam < 18 ? 'Selamat sore!' : 'Selamat malam!';
}

export function Beranda() {
  const { memuat, berlaku, data } = useHarga();
  return (
    <div className="space-y-7">
      <BibiBicara judul={salam()} pose="menyapa" besar>
        <span className="text-sm text-biru">
          {memuat ? 'Sebentar, Bibi ambil harga hari ini…' : berlaku ? 'Harga buyback perhiasan hari ini sudah ditetapkan.' : data ? 'Harga hari ini belum ditetapkan. Ini harga terakhir.' : 'Harga belum bisa dimuat.'}
        </span>
        <span className="mt-0.5 block">Aku Bibi, siap bantu hitung estimasi perhiasanmu.</span>
      </BibiBicara>

      <TabelHarga />

      <section className="relative grid grid-cols-[1fr_96px] items-center gap-2 overflow-hidden rounded-3xl bg-krem p-5 text-biru">
        <div>
          <h2 className="text-[19px] font-bold leading-tight [text-wrap:balance]">Berapa nilai perhiasanmu?</h2>
          <p className="mb-3 mt-1.5 text-[13px] text-abu-biru">Jawab 3 pertanyaan singkat bareng Bibi.</p>
          <Link to="/kalkulator" className="tombol-biru">Hitung estimasi</Link>
        </div>
        <Bibi pose="hp" className="h-28 w-24" tunda={-1.4} />
      </section>

      <GrafikEmas siap={!memuat} />
      <Referensi />

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#164B8F] to-biru-2 p-5">
        <div className="absolute -right-1 top-2"><Bibi pose="menyapa" className="h-24 w-24" tunda={-0.7} /></div>
        <h2 className="text-lg font-bold">Mampir ke toko, yuk</h2>
        <p className="mt-1 max-w-[70%] text-[13px] text-krem/75">{TOKO.alamat}. {TOKO.jamTampil}.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <TombolRute />
          <TombolWa className="!bg-krem hover:!bg-white" />
        </div>
      </section>
    </div>
  );
}
