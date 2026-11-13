import { useEffect, useState } from 'react';
import { useHarga } from '../lib/HargaContext';
import { sekarang, statusToko } from '../lib/waktu';

export function StatusToko({ className = '' }: { className?: string }) {
  const { toko } = useHarga();
  const [kini, setKini] = useState(sekarang());
  useEffect(() => {
    const t = setInterval(() => setKini(sekarang()), 30000);
    return () => clearInterval(t);
  }, []);
  const s = statusToko(toko, kini);
  return (
    <div className={`inline-flex flex-col rounded-xl px-3 py-2 text-sm ${s.buka ? 'bg-mustard text-biru' : 'bg-abu-biru text-krem'} ${className}`} data-testid="status-toko">
      <span className="flex items-center gap-2 font-semibold">
        <span className={`h-2.5 w-2.5 rounded-full ${s.buka ? 'bg-biru' : 'bg-krem'}`} aria-hidden="true" />
        {s.teks}
      </span>
      {s.keterangan && <span className="text-xs">{s.keterangan}</span>}
    </div>
  );
}
