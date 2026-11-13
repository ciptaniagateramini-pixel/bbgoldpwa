import { CATATAN_WAJIB } from './konten';
import { beratTampil, labelKadar, rupiah, tanggalJam } from './format';
import { POLOS, type Estimasi } from './kalkulator';

export interface RingkasanHasil {
  kadar: string;
  jenis: string;
  jenisTampil: string;
  berat: number;
  permata: boolean;
  estimasi: Estimasi;
  ditetapkanPada: string;
}

export function teksEstimasi(e: Estimasi): string {
  if (e.tipe === 'tunggal') return `± ${rupiah(e.nilai)}`;
  if (e.tipe === 'rentang') return e.min === e.max ? `± ${rupiah(e.min)}` : `± ${rupiah(e.min)} sampai ${rupiah(e.max)}`;
  return 'perlu dicek di toko';
}

export function pesanWa(h: RingkasanHasil): string {
  const kode = h.kadar === POLOS ? 'Tidak ada kode (polos), perlu uji kadar' : labelKadar(h.kadar);
  return [
    'Halo BB GOLD, saya mau cek perhiasan.',
    `Kode: ${kode}`,
    `Cap/jenis: ${h.jenisTampil}`,
    `Berat: ${beratTampil(h.berat)} gram`,
    `Ada permata/aksesoris: ${h.permata ? 'Ya' : 'Tidak'}`,
    `Estimasi: ${teksEstimasi(h.estimasi)} (harga ditetapkan ${tanggalJam(h.ditetapkanPada)})`,
    '',
    CATATAN_WAJIB,
    '',
    'Ini estimasi dari kalkulator, mohon dicek.',
  ].join('\n');
}
