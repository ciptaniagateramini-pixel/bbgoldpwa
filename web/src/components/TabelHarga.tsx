import { useEffect, useRef, useState } from 'react';
import { useHarga } from '../lib/HargaContext';
import { labelKadar, rupiah, tanggalJam } from '../lib/format';
import type { ItemHarga } from '../lib/types';
import { CatatanWajib } from './CatatanWajib';

/** Kadar yang ditonjolkan sebagai kartu besar (yang ada di Sheet saja yang tampil). */
const UNGGULAN: [string, string][] = [['375', 'Pabrik'], ['700', 'Lokal'], ['750', 'Kuning'], ['916', '-'], ['24K', '-']];

function AngkaNaik({ n }: { n: number }) {
  const [v, setV] = useState(n);
  const sudah = useRef(false);
  useEffect(() => {
    if (sudah.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(n); return; }
    sudah.current = true;
    const t0 = performance.now();
    let id = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setV(p < 1 ? Math.round((n * (1 - Math.pow(1 - p, 3))) / 50) * 50 : n);
      if (p < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [n]);
  return <>{rupiah(v)}</>;
}

function pilihUnggulan(items: ItemHarga[]): ItemHarga[] {
  const out = UNGGULAN.map(([k, j]) => items.find((i) => i.kadar === k && i.jenis === j)).filter(Boolean) as ItemHarga[];
  return out.length >= 3 ? out : items.slice(0, 5);
}

export function TabelHarga() {
  const { memuat, data, berlaku } = useHarga();

  return (
    <section aria-labelledby="judul-harga" className="space-y-3">
      <div>
        <h1 id="judul-harga" className="text-xl font-bold leading-tight [text-wrap:balance]">Harga buyback perhiasan BB GOLD per gram</h1>
        <p className="mt-1 text-[13px] text-krem/70">Kadar yang paling sering dijual. Geser untuk lihat lainnya.</p>
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

      {memuat && <div className="h-32 animate-pulse rounded-[22px] bg-mustard/30" aria-label="Memuat harga" />}

      {!memuat && !data && (
        <div className="kartu p-5" role="alert">
          <p className="font-semibold">Harga belum bisa dimuat.</p>
          <p className="text-sm text-abu-biru">Periksa koneksi internet, atau tanyakan harga hari ini lewat WhatsApp toko.</p>
        </div>
      )}

      {data && (
        <div className={`geser ${berlaku ? '' : 'redup'}`} aria-label="Harga kadar unggulan">
          {pilihUnggulan(data.items).map((it) => (
            <article key={`${it.kadar}-${it.jenis}`} className="kartu-emas">
              <div className="text-[13px] font-bold uppercase tracking-[.12em]">
                {labelKadar(it.kadar)}
                {it.jenis !== '-' && <span className="ml-1.5 rounded-full bg-biru/10 px-2 py-px text-[11px] font-semibold normal-case tracking-normal">{it.jenis}</span>}
              </div>
              <div className="mt-2 text-[28px] font-extrabold leading-tight tabular-nums">{berlaku ? <AngkaNaik n={it.hargaPerGram} /> : rupiah(it.hargaPerGram)}</div>
              <div className="text-xs font-semibold opacity-75">per gram</div>
              <svg viewBox="0 0 100 100" className="absolute -bottom-4 -right-3 w-20 opacity-20" aria-hidden="true"><use href="#hex" /></svg>
            </article>
          ))}
        </div>
      )}

      <CatatanWajib />

      {data && (
        <details className="semua overflow-hidden rounded-[18px] border border-white/10 bg-biru-2">
          <summary className="flex min-h-[52px] cursor-pointer items-center justify-between px-4 font-semibold">
            <span>Lihat semua kadar ({data.items.length})</span>
            <svg className="panah h-5 w-5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </summary>
          <div data-testid="tabel-harga" data-berlaku={berlaku ? 'ya' : 'tidak'} className={berlaku ? '' : 'opacity-60'}>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Harga buyback perhiasan BB GOLD per gram</caption>
              <thead className="sr-only"><tr><th scope="col">Kadar</th><th scope="col">Jenis</th><th scope="col">Harga per gram</th></tr></thead>
              <tbody>
                {data.items.map((it) => (
                  <tr key={`${it.kadar}-${it.jenis}`} className="border-t border-white/10">
                    <td className="py-3 pl-4 font-semibold">{labelKadar(it.kadar)}</td>
                    <td className="py-3 text-xs text-krem/65">{it.jenis === '-' ? '' : it.jenis}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-right font-bold tabular-nums">{rupiah(it.hargaPerGram)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {data?.ditetapkanPada && (
        <p className="px-0.5 text-xs text-krem/70" data-testid="cap-waktu">Ditetapkan {tanggalJam(data.ditetapkanPada)} · nilai akhir ditentukan setelah perhiasan dicek dan ditimbang di toko.</p>
      )}
    </section>
  );
}
