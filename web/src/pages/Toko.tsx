import { PetaToko } from '../components/PetaToko';
import { StatusToko } from '../components/StatusToko';
import { TombolRute, TombolWa } from '../components/AksiToko';
import { TOKO } from '../lib/konten';
import { useHarga } from '../lib/HargaContext';
import { bagianWib, sekarang } from '../lib/waktu';

export function Toko() {
  const { toko } = useHarga();
  const mendatang = toko.tutupKhusus.filter((x) => x.tanggal >= bagianWib(sekarang()).tanggal).slice(0, 5);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Toko BB GOLD</h1>
      <div className="kartu space-y-4 p-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-abu-biru">Alamat</h2>
          <p className="mt-1 font-medium">{TOKO.alamat}</p>
          <p className="mt-2 text-sm text-abu-biru">{TOKO.catatanMaps}.</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-abu-biru">Jam buka</h2>
          <p className="mt-1 font-medium">{TOKO.jamTampil}</p>
          <StatusToko className="mt-2" />
          {mendatang.length > 0 && (
            <ul className="mt-2 text-sm text-abu-biru">
              {mendatang.map((x) => <li key={x.tanggal}>Tutup {x.tanggal}: {x.keterangan}</li>)}
            </ul>
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-abu-biru">Kontak</h2>
          <a className="mt-2 flex min-h-[48px] items-center justify-between gap-3 rounded-xl border border-biru/15 bg-white px-4 py-2" href={`https://wa.me/${TOKO.waNomor}`} target="_blank" rel="noopener">
            <span className="text-sm text-abu-biru">WhatsApp</span>
            <span className="font-semibold">{TOKO.waTampil}</span>
          </a>
          <a className="mt-2 flex min-h-[48px] flex-wrap items-center justify-between gap-x-3 rounded-xl border border-biru/15 bg-white px-4 py-2" href={`mailto:${TOKO.email}`}>
            <span className="text-sm text-abu-biru">Email</span>
            <span className="break-all font-semibold">{TOKO.email}</span>
          </a>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TombolRute />
        <TombolWa />
      </div>
      <PetaToko />
    </div>
  );
}
