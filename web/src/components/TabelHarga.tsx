import { useHarga } from '../lib/HargaContext';
import { labelKadar, rupiah, tanggalJam } from '../lib/format';
import { CatatanWajib } from './CatatanWajib';

export function TabelHarga() {
  const { memuat, data, berlaku } = useHarga();

  return (
    <section aria-labelledby="judul-harga" className="space-y-3">
      <div>
        <h1 id="judul-harga" className="text-2xl font-semibold leading-tight">Harga buyback perhiasan BB GOLD per gram</h1>
        {data?.ditetapkanPada && (
          <p className="mt-1 text-sm text-krem/80" data-testid="cap-waktu">Ditetapkan {tanggalJam(data.ditetapkanPada)}</p>
        )}
      </div>

      {!memuat && data && !berlaku && (
        <div role="alert" data-testid="banner-basi" className="rounded-2xl border-2 border-mustard bg-biru-2 px-4 py-3">
          <p className="font-semibold text-mustard">Harga hari ini belum ditetapkan</p>
          <p className="text-sm text-krem/85">
            {data.ditetapkanPada ? `Angka di bawah adalah harga terakhir (${tanggalJam(data.ditetapkanPada)}) dan belum berlaku hari ini.` : 'Angka di bawah adalah harga terakhir dan belum berlaku hari ini.'}{' '}
            Kalkulator aktif kembali setelah harga hari ini ditetapkan. Tanyakan harga terbaru lewat WhatsApp toko.
          </p>
        </div>
      )}

      {memuat && <div className="kartu h-64 animate-pulse" aria-label="Memuat harga" />}

      {!memuat && !data && (
        <div className="kartu p-5" role="alert">
          <p className="font-semibold">Harga belum bisa dimuat.</p>
          <p className="text-sm text-abu-biru">Periksa koneksi internet, atau tanyakan harga hari ini lewat WhatsApp toko.</p>
        </div>
      )}

      {data && (
        <div className={`kartu overflow-hidden ${berlaku ? '' : 'opacity-60'}`} data-testid="tabel-harga" data-berlaku={berlaku ? 'ya' : 'tidak'}>
          <table className="w-full text-left">
            <caption className="sr-only">Harga buyback perhiasan BB GOLD per gram</caption>
            <thead className="bg-mustard text-biru">
              <tr>
                <th scope="col" className="px-4 py-3 text-sm font-semibold">Kadar</th>
                <th scope="col" className="px-2 py-3 text-sm font-semibold">Jenis</th>
                <th scope="col" className="px-4 py-3 text-right text-sm font-semibold">Harga / gram</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((it, i) => (
                <tr key={`${it.kadar}-${it.jenis}`} className={i % 2 ? 'bg-white/60' : ''}>
                  <td className="px-4 py-3 font-semibold">{labelKadar(it.kadar)}</td>
                  <td className="px-2 py-3 text-sm">{it.jenis === '-' ? '' : it.jenis}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">{rupiah(it.hargaPerGram)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CatatanWajib />
      <p className="text-sm text-krem/80">Harga di atas adalah harga buyback (toko membeli) perhiasan per gram emas. Nilai akhir ditentukan setelah perhiasan dicek dan ditimbang di toko.</p>
    </section>
  );
}
