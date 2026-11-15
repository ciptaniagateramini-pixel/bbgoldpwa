import type { Aset, DataHarga } from './hitung';

export class GalatApi extends Error {
  constructor(public kode: string, public status: number, public kolom?: Record<string, string>) { super(kode); }
}

async function minta<T>(url: string, body?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, body === undefined
      ? { credentials: 'same-origin', headers: { Accept: 'application/json' } }
      : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-DE': '1' }, body: JSON.stringify(body) });
  } catch {
    throw new GalatApi('jaringan', 0);
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.ok !== true) throw new GalatApi(j.error || 'gagal', r.status, j.kolom);
  return j as T;
}

export type Pengguna = { email: string; boleh_dihubungi: boolean; admin: boolean };
export const api = {
  saya: () => minta<{ pengguna: Pengguna | null }>('/api/auth.php').then((j) => j.pengguna),
  kirimKode: (email: string) => minta('/api/auth.php', { aksi: 'kirim_kode', email }),
  masuk: (email: string, kode: string) => minta('/api/auth.php', { aksi: 'masuk', email, kode }),
  keluar: () => minta('/api/auth.php', { aksi: 'keluar' }),
  harga: () => minta<DataHarga & { ok: true }>('/api/harga.php'),
  aset: () => minta<{ aset: Aset[] }>('/api/aset.php').then((j) => j.aset),
  simpan: (a: Aset) => minta<{ aset: Aset }>('/api/aset.php', { aksi: a.id ? 'ubah' : 'tambah', ...a }).then((j) => j.aset),
  hapus: (id: number) => minta('/api/aset.php', { aksi: 'hapus', id }),
  atur: (boleh: boolean) => minta('/api/akun.php', { aksi: 'atur', boleh_dihubungi: boleh }),
  hapusAkun: () => minta('/api/akun.php', { aksi: 'hapus_akun', konfirmasi: 'HAPUS' }),
  admin: () => minta<Record<string, unknown>>('/api/admin.php'),
};

export function pesanGalat(e: unknown): string {
  const k = e instanceof GalatApi ? e.kode : 'gagal';
  return ({
    jaringan: 'Tidak ada koneksi internet. Coba lagi.',
    email_tidak_valid: 'Alamat email tidak valid.',
    terlalu_sering: 'Terlalu sering mencoba. Tunggu beberapa menit lalu coba lagi.',
    kode_salah: 'Kode salah. Periksa lagi emailmu.',
    kode_kedaluwarsa: 'Kode sudah tidak berlaku. Minta kode baru.',
    email_gagal: 'Email gagal dikirim. Coba lagi sebentar lagi.',
    belum_masuk: 'Sesi berakhir. Silakan masuk lagi.',
    batas_aset: 'Maksimal 200 aset per akun.',
  } as Record<string, string>)[k] ?? 'Terjadi kesalahan. Coba lagi.';
}
