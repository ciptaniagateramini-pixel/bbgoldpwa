import { useState } from 'react';
import { mapsEmbedUrl } from '../lib/konten';

/** Peta Google Maps berbasis alamat (tanpa API berbayar). Offline/gagal: tidak tampil. */
export function PetaToko() {
  const [gagal, setGagal] = useState(typeof navigator !== 'undefined' && !navigator.onLine);
  if (gagal) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-biru-2">
      <iframe
        title="Peta lokasi BB GOLD"
        src={mapsEmbedUrl()}
        className="h-64 w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onError={() => setGagal(true)}
      />
    </div>
  );
}
