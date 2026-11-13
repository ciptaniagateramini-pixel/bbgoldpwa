import { useEffect, useState } from 'react';
import { ambilReferensi } from '../lib/api';
import { rupiah } from '../lib/format';
import type { DataReferensi, SumberReferensi } from '../lib/types';

function Sumber({ nama, s, satuan }: { nama: string; s: SumberReferensi | null; satuan: string }) {
  if (!s) return null;
  return (
    <div className="kartu p-4" data-testid={`ref-${nama.toLowerCase()}`} data-basi={s.basi ? 'ya' : 'tidak'}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">{nama}</h3>
        {s.basi ? (
          <span className="rounded-full bg-abu-biru px-2 py-0.5 text-xs font-semibold text-krem">belum diperbarui</span>
        ) : (
          <span className="rounded-full bg-mustard-muda px-2 py-0.5 text-xs font-semibold text-biru">hari ini</span>
        )}
      </div>
      <p className="mt-0.5 text-xs text-abu-biru">Update: {s.keterangan || 'tidak diketahui'} · {satuan}</p>
      {s.items.length > 0 ? (
        <ul className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm ${s.basi ? 'opacity-60' : ''}`}>
          {s.items.map((it) => (
            <li key={it.label} className="flex justify-between gap-2 border-b border-biru/10 py-1">
              <span>{it.label}</span>
              <span className="font-semibold tabular-nums">{rupiah(it.harga)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-abu-biru">Angka disembunyikan karena belum diperbarui hari ini.</p>
      )}
    </div>
  );
}

export function Referensi() {
  const [d, setD] = useState<DataReferensi | null | undefined>(undefined);
  useEffect(() => {
    void ambilReferensi().then(setD);
  }, []);

  return (
    <section aria-labelledby="judul-ref" className="space-y-3">
      <div>
        <h2 id="judul-ref" className="judul-blok">Referensi buyback resmi (bukan harga BB GOLD)</h2>
        <p className="text-sm text-krem/80">Harga buyback emas batangan dari situs resmi masing-masing merek, sebagai pembanding. Bukan harga BB GOLD dan bukan untuk perhiasan.</p>
      </div>
      {d === undefined && <div className="kartu h-32 animate-pulse" />}
      {d === null && <p className="text-sm text-krem/70">Referensi belum bisa dimuat.</p>}
      {d && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Sumber nama="Antam" s={d.antam} satuan="buyback per gram" />
          <Sumber nama="UBS" s={d.ubs} satuan="buyback per pecahan" />
          <Sumber nama="Hartadinata" s={d.hartadinata} satuan="buyback resmi per keping" />
          <Sumber nama="Redmark" s={d.redmark} satuan="buyback asli per keping" />
        </div>
      )}
    </section>
  );
}
