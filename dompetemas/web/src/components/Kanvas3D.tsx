import { useEffect, useRef } from 'react';
import type { Aset } from '../lib/hitung';

/** Kanvas yang menampilkan model 3D aset. Mesin 3D dimuat belakangan (lazy) agar halaman cepat tampil. */
export function Kanvas3D({ aset, fase = 0, className }: { aset: Aset; fase?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const kunci = `${aset.jenis}|${aset.bentuk}|${aset.kadar}|${aset.sub}|${aset.merek}|${aset.pecahan}`;
  useEffect(() => {
    let lepas: (() => void) | undefined;
    let batal = false;
    import('../lib/emas3d').then((m) => {
      if (!batal && ref.current) lepas = m.pasang(ref.current, aset, fase);
    }).catch(() => {});
    return () => { batal = true; lepas?.(); };
  }, [kunci, fase]); // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
