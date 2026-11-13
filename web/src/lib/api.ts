import type { DataHarga, DataReferensi } from './types';
import { baca, tulis } from './simpan';
import { setWaktuServer } from './waktu';

export interface HasilHarga {
  data: DataHarga | null;
  offline: boolean; // true bila memakai data tersimpan di perangkat
}

/** Ambil harga; bila gagal, pakai harga tersimpan terakhir (dengan cap waktunya). */
export async function ambilHarga(): Promise<HasilHarga> {
  try {
    const r = await fetch('/api/harga.php', { headers: { Accept: 'application/json' } });
    const j = (await r.json()) as DataHarga;
    if (!r.ok || j.ok !== true || !Array.isArray(j.items)) throw new Error('respons');
    setWaktuServer(j.waktuServer);
    const offlineSw = r.headers.get('X-BB-Offline') === '1';
    if (!offlineSw) tulis('local', 'bb_harga', j);
    return { data: j, offline: offlineSw };
  } catch {
    return { data: baca<DataHarga>('local', 'bb_harga'), offline: true };
  }
}

export async function ambilReferensi(): Promise<DataReferensi | null> {
  try {
    const r = await fetch('/api/harga.php?data=referensi', { headers: { Accept: 'application/json' } });
    const j = (await r.json()) as DataReferensi;
    if (!r.ok || j.ok !== true) throw new Error('respons');
    tulis('local', 'bb_referensi', j);
    return j;
  } catch {
    return baca<DataReferensi>('local', 'bb_referensi');
  }
}

export interface KirimanLead {
  id: string;
  perangkat: string;
  nama: string;
  wa: string;
  email: string;
  setuju: boolean;
  website: string; // kolom jebakan
  kadar: string;
  jenis: string;
  polos: boolean;
  berat: number;
  permata: boolean;
  sumber: string;
}

export type HasilKirim =
  | { status: 'ok' }
  | { status: 'validasi'; kolom: Record<string, string> }
  | { status: 'gagal' }; // jaringan / server: hasil tetap ditampilkan, kirim ulang di latar

export async function kirimLead(k: KirimanLead): Promise<HasilKirim> {
  try {
    const r = await fetch('/api/lead.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(k),
      cache: 'no-store',
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok === true) return { status: 'ok' };
    if (r.status === 400 && j.kolom) return { status: 'validasi', kolom: j.kolom };
    if (r.status === 429) return { status: 'ok' }; // sudah sering mengirim: jangan buntu, jangan antre ulang
    return { status: 'gagal' };
  } catch {
    return { status: 'gagal' };
  }
}

const ANTRE = 'bb_antrean_lead';

export function antreLead(k: KirimanLead) {
  const q = baca<KirimanLead[]>('local', ANTRE) ?? [];
  if (!q.some((x) => x.id === k.id)) q.push(k);
  tulis('local', ANTRE, q.slice(-5));
}

let sedangKirim = false;
/** Kirim ulang antrean di latar belakang (saat aplikasi dibuka / kembali online). */
export async function kirimUlangAntrean(tunda = 0) {
  if (sedangKirim) return;
  sedangKirim = true;
  try {
    if (tunda) await new Promise((r) => setTimeout(r, tunda));
    const q = baca<KirimanLead[]>('local', ANTRE) ?? [];
    const sisa: KirimanLead[] = [];
    for (const k of q) {
      const h = await kirimLead(k);
      if (h.status === 'gagal') sisa.push(k);
    }
    tulis('local', ANTRE, sisa);
    if (sisa.length && tunda < 120000) {
      sedangKirim = false;
      void kirimUlangAntrean(Math.max(5000, tunda * 2));
      return;
    }
  } finally {
    sedangKirim = false;
  }
}
