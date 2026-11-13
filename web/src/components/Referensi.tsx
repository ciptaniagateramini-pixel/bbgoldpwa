import { useEffect, useState } from 'react';
import { ambilReferensi } from '../lib/api';
import { rupiah } from '../lib/format';
import type { DataReferensi, SumberReferensi } from '../lib/types';

function Sumber({ nama, s, satuan }: { nama: string; s: SumberReferensi | null; satuan: string }) {
  if (!s) return null;
  const utama = s.items.find((i) => /^1\s?(g|gr|gram)$/i.test(i.label)) ?? s.items[0];
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-biru-2 p-3.5" data-testid={`ref-${nama.toLowerCase()}`} data-basi={s.basi ? 'ya' : 'tidak'}>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <h3 className="text-[13px] font-bold">{nama}</h3>
        {s.basi ? (
          <span className="rounded-full bg-abu-biru px-2 py-px text-[11px] font-semibold text-krem">belum diperbarui</span>
        ) : (
          <span className="rounded-full bg-mustard-muda px-2 py-px text-[11px] font-semibold text-biru">hari ini</span>
        )}
      </div>
      {utama ? (
        <div className={s.basi ? 'opacity-60' : ''}>
          <div className="mt-1 text-base font-bold tabular-nums">{rupiah(utama.harga)}</div>
          <div className="text-[11px] text-krem/65">{utama.label} · {satuan}</div>
        </div>
      ) : (
        <p className="mt-1 text-[12px] text-krem/65">Angka disembunyikan karena belum diperbarui hari ini.</p>
      )}
      <p className="mt-1 text-[11px] text-krem/55">Update: {s.keterangan || 'tidak diketahui'}</p>
      {s.items.length > 1 && (
        <details className="mt-1">
          <summary className="cursor-pointer py-1 text-[12px] font-semibold text-mustard-muda">Semua pecahan</summary>
          <ul className={`text-[12px] ${s.basi ? 'opacity-60' : ''}`}>
            {s.items.map((it) => (
              <li key={it.label} className="flex justify-between gap-2 border-t border-white/10 py-1">
                <span>{it.label}</span>
                <span className="font-semibold tabular-nums">{rupiah(it.harga)}</span>
              </li>
            ))}
          </ul>
        </details>
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
        <h2 id="judul-ref" className="judul-blok [text-wrap:balance]">Referensi buyback resmi (bukan harga BB GOLD)</h2>
        <p className="text-sm text-krem/80">Harga buyback emas batangan dari situs resmi masing-masing merek, sebagai pembanding. Bukan harga BB GOLD dan bukan untuk perhiasan.</p>
      </div>
      {d === undefined && <div className="h-32 animate-pulse rounded-2xl bg-biru-2" />}
      {d === null && <p className="text-sm text-krem/70">Referensi belum bisa dimuat.</p>}
      {d && (
        <div className="grid grid-cols-2 gap-2.5">
          <Sumber nama="Antam" s={d.antam} satuan="buyback" />
          <Sumber nama="UBS" s={d.ubs} satuan="buyback" />
          <Sumber nama="Hartadinata" s={d.hartadinata} satuan="buyback resmi" />
          <Sumber nama="Redmark" s={d.redmark} satuan="buyback asli" />
        </div>
      )}
    </section>
  );
}
