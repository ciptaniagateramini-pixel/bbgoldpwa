import type { ItemHarga } from './types';

export const POLOS = '__polos__';

/** Kadar unik sesuai urutan baris di Sheet. */
export function daftarKadar(items: ItemHarga[]): string[] {
  const out: string[] = [];
  for (const it of items) if (!out.includes(it.kadar)) out.push(it.kadar);
  return out;
}

export function jenisUntuk(items: ItemHarga[], kadar: string): string[] {
  return items.filter((i) => i.kadar === kadar).map((i) => i.jenis);
}

export type JenisPertanyaan =
  | { tipe: 'lewati'; jenis: string }
  | { tipe: 'cap'; capPabrik: string; lokal: string }
  | { tipe: 'warna'; pilihan: string[] }
  | { tipe: 'pilih'; pilihan: string[] };

/** Langkah 2 hanya muncul bila kadar punya lebih dari satu jenis di Sheet. */
export function pertanyaanLangkah2(items: ItemHarga[], kadar: string): JenisPertanyaan {
  const j = jenisUntuk(items, kadar);
  if (j.length <= 1) return { tipe: 'lewati', jenis: j[0] ?? '-' };
  const lower = j.map((x) => x.toLowerCase());
  const cap = j.find((x) => /cap|pabrik/i.test(x) && x.toLowerCase() !== 'lokal');
  const lokal = j.find((x) => x.toLowerCase() === 'lokal');
  if (j.length === 2 && cap && lokal) return { tipe: 'cap', capPabrik: cap, lokal };
  if (lower.every((x) => ['kuning', 'putih', 'rose', 'merah'].includes(x))) return { tipe: 'warna', pilihan: j };
  return { tipe: 'pilih', pilihan: j };
}

export function bulatBawahRibu(x: number): number {
  return Math.floor(x / 1000) * 1000;
}

export type Estimasi =
  | { tipe: 'tunggal'; nilai: number; hargaPerGram: number }
  | { tipe: 'rentang'; min: number; max: number }
  | { tipe: 'tanpa-angka' };

export function hitungEstimasi(items: ItemHarga[], kadar: string, jenis: string, berat: number): Estimasi | null {
  if (!(berat > 0)) return null;
  if (kadar === POLOS) {
    const lokal = items.filter((i) => i.jenis.toLowerCase() === 'lokal').map((i) => i.hargaPerGram);
    if (!lokal.length) return { tipe: 'tanpa-angka' };
    const min = bulatBawahRibu(berat * Math.min(...lokal));
    const max = bulatBawahRibu(berat * Math.max(...lokal));
    return { tipe: 'rentang', min, max };
  }
  const row = items.find((i) => i.kadar === kadar && i.jenis === jenis);
  if (!row) return null;
  return { tipe: 'tunggal', nilai: bulatBawahRibu(berat * row.hargaPerGram), hargaPerGram: row.hargaPerGram };
}

/** "3,25" atau "3.25" -> 3.25; null bila tidak valid. Maks 1000 g, 2 desimal. */
export function parseBerat(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n > 0 && n <= 1000 ? n : null;
}

/** Normalisasi nomor WA ke +628xxxxxxxx; null bila tidak valid. */
export function normalisasiWa(input: string): string | null {
  let d = input.replace(/[\s\-().]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (!/^\d+$/.test(d)) return null;
  if (d.startsWith('62')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  if (!/^8\d{7,12}$/.test(d)) return null;
  return '+62' + d;
}
