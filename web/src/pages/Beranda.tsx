import { Link } from 'react-router-dom';
import { TabelHarga } from '../components/TabelHarga';
import { GrafikEmas } from '../components/GrafikEmas';
import { Referensi } from '../components/Referensi';
import { TombolRute, TombolWa } from '../components/AksiToko';
import { IkonKalkulator } from '../components/Ikon';
import { StatusToko } from '../components/StatusToko';
import { useHarga } from '../lib/HargaContext';
import { SLOGAN } from '../lib/konten';

export function Beranda() {
  const { memuat } = useHarga();
  return (
    <div className="space-y-8">
      <p className="text-sm font-medium text-mustard-muda">{SLOGAN}</p>
      <TabelHarga />

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/kalkulator" className="tombol-mustard"><IkonKalkulator /> Hitung estimasi</Link>
        <TombolWa className="!bg-krem hover:!bg-white" />
        <TombolRute />
      </div>
      <StatusToko />

      <GrafikEmas siap={!memuat} />
      <Referensi />
    </div>
  );
}
