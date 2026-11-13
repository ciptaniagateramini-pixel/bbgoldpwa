import { IkonRute, IkonWa } from './Ikon';
import { TOKO, waLink } from '../lib/konten';

export function TombolRute({ className = '' }: { className?: string }) {
  return (
    <a href={TOKO.mapsRute} target="_blank" rel="noopener" className={`tombol-garis ${className}`}>
      <IkonRute /> Buka rute di Google Maps
    </a>
  );
}

export function TombolWa({ pesan = 'Halo BB GOLD, saya mau tanya harga buyback perhiasan hari ini.', label = 'Chat WhatsApp toko', className = '' }) {
  return (
    <a href={waLink(pesan)} target="_blank" rel="noopener" className={`tombol-mustard ${className}`}>
      <IkonWa /> {label}
    </a>
  );
}
