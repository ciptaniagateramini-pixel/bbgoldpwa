/** Perhitungan nilai & untung-rugi (murni, diuji unit). */
export interface ItemHarga { kadar: string; jenis: string; hargaPerGram: number }
export interface SumberBatangan { tanggal: string | null; basi: boolean; items: { label: string; harga: number }[] }
export interface DataHarga {
  perhiasan: { ditetapkanPada: string | null; items: ItemHarga[] };
  batangan: { antam: SumberBatangan | null; ubs: SumberBatangan | null; hartadinata: SumberBatangan | null };
  diambilPada: string;
  waktuServer: string;
}
export type Merek = 'Antam' | 'UBS' | 'Hartadinata';
export const MEREK: Merek[] = ['Antam', 'UBS', 'Hartadinata'];
export const BENTUK = ['Cincin', 'Kalung', 'Gelang', 'Anting', 'Liontin', 'Lainnya'] as const;
export const PECAHAN_ANTAM = ['0,5 g', '1 g', '2 g', '3 g', '5 g', '10 g', '25 g', '50 g', '100 g'];

export interface Aset {
  id?: number;
  jenis: 'perhiasan' | 'batangan';
  nama: string;
  bentuk: string | null;
  kadar: string | null;
  sub: string | null;
  berat: number | null;
  merek: Merek | null;
  pecahan: string | null;
  keping: number | null;
  tahun: number;
  harga_beli: number;
}

export function rp(n: number): string {
  const s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (n < 0 ? '−' : '') + 'Rp ' + s;
}
export function persen(x: number): string {
  return (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(1).replace('.', ',') + '%';
}
export function koma(x: number): string {
  return String(Math.round(x * 1000) / 1000).replace('.', ',');
}
export function labelKadar(k: string): string {
  return /^\d{3}$/.test(k) ? `KODE ${k}` : k;
}
export const bawahRibu = (x: number) => Math.floor(x / 1000) * 1000;

/** "1 gram" / "1 gr" / "0,5 g" -> "1 g" / "0,5 g" */
export function normalPecahan(label: string): string {
  const m = label.trim().match(/^([0-9]{1,3}(?:,[0-9]{1,2})?)\s?(g|gr|gram)$/i);
  return m ? `${m[1]} g` : label;
}
export function gramDari(p: string): number {
  return parseFloat(normalPecahan(p).replace(' g', '').replace(',', '.'));
}
export function daftarPecahan(h: DataHarga | null, merek: Merek): string[] {
  if (merek === 'Antam') return PECAHAN_ANTAM;
  const s = h?.batangan[merek.toLowerCase() as 'ubs' | 'hartadinata'];
  const l = s?.items.map((i) => normalPecahan(i.label)) ?? [];
  return l.length ? l : ['1 g', '2 g', '5 g', '10 g'];
}

export function beratEmas(a: Aset): number {
  return a.jenis === 'perhiasan' ? a.berat ?? 0 : gramDari(a.pecahan ?? '0 g') * (a.keping ?? 1);
}

/** null bila harga untuk aset itu tidak tersedia. */
export function nilaiHariIni(a: Aset, h: DataHarga | null): number | null {
  if (!h) return null;
  if (a.jenis === 'perhiasan') {
    const r = h.perhiasan.items.find((i) => i.kadar === a.kadar && i.jenis === a.sub);
    return r && a.berat ? bawahRibu(a.berat * r.hargaPerGram) : null;
  }
  const s = h.batangan[(a.merek ?? '').toLowerCase() as 'antam' | 'ubs' | 'hartadinata'];
  if (!s || !s.items.length || !a.pecahan) return null;
  const peta = new Map(s.items.map((i) => [normalPecahan(i.label), i.harga]));
  let per = a.merek === 'Antam' ? undefined : peta.get(normalPecahan(a.pecahan));
  if (per === undefined) {
    const satu = peta.get('1 g');
    if (satu === undefined) return null;
    per = satu * gramDari(a.pecahan);
  }
  return bawahRibu(per * (a.keping ?? 1));
}

export interface Analisis { nilai: number | null; selisih: number | null; persen: number | null; tahun: number; perTahun: number | null }
export function analisis(a: Aset, h: DataHarga | null, tahunIni: number): Analisis {
  const nilai = nilaiHariIni(a, h);
  const tahun = tahunIni - a.tahun;
  if (nilai === null) return { nilai, selisih: null, persen: null, tahun, perTahun: null };
  const selisih = nilai - a.harga_beli;
  const pr = a.harga_beli ? selisih / a.harga_beli : 0;
  const perTahun = tahun >= 1 && a.harga_beli > 0 && nilai > 0 ? Math.pow(nilai / a.harga_beli, 1 / tahun) - 1 : null;
  return { nilai, selisih, persen: pr, tahun, perTahun };
}

export function namaAset(a: Aset): string {
  if (a.nama) return a.nama;
  return a.jenis === 'perhiasan' ? `${a.bentuk ?? 'Perhiasan'} ${labelKadar(a.kadar ?? '')}` : `${a.merek} ${a.pecahan}`;
}
export function ketAset(a: Aset): string {
  return a.jenis === 'perhiasan'
    ? `${labelKadar(a.kadar ?? '')}${a.sub && a.sub !== '-' ? ' · ' + a.sub : ''} · ${koma(a.berat ?? 0)} g · beli ${a.tahun}`
    : `${a.pecahan}${(a.keping ?? 1) > 1 ? ` × ${a.keping} keping` : ''} · beli ${a.tahun}`;
}

/** Angka rupiah dari teks "2.500.000" */
export function angka(s: string): number {
  return parseInt(s.replace(/\D/g, ''), 10) || 0;
}
export function formatRibuan(n: number): string {
  return n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
}
export function parseBerat(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!/^\d{1,5}(\.\d{1,3})?$/.test(t)) return null;
  const n = Number(t);
  return n > 0 && n <= 10000 ? n : null;
}
