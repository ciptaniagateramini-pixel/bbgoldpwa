import type { ConfigToko } from './types';

const TZ = 'Asia/Jakarta';
let selisihServer = 0; // ms: waktu server - waktu perangkat

/** Koreksi jam perangkat dengan jam server (dari respons API). */
export function setWaktuServer(iso: string | undefined) {
  if (!iso) return;
  const t = Date.parse(iso);
  if (!Number.isNaN(t)) selisihServer = t - Date.now();
}

export function sekarang(): Date {
  return new Date(Date.now() + selisihServer);
}

export interface BagianWib {
  tanggal: string; // YYYY-MM-DD
  menit: number; // menit sejak 00.00 WIB
}

export function bagianWib(d: Date, tz = TZ): BagianWib {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? '00';
  return { tanggal: `${g('year')}-${g('month')}-${g('day')}`, menit: Number(g('hour')) * 60 + Number(g('minute')) };
}

/** Harga berlaku hanya untuk hari kalender WIB saat B3 diisi. */
export function hargaBerlakuHariIni(ditetapkanPada: string | null, kini: Date): boolean {
  if (!ditetapkanPada) return false;
  const t = new Date(ditetapkanPada);
  if (Number.isNaN(t.getTime())) return false;
  return bagianWib(t).tanggal === bagianWib(kini).tanggal;
}

function keMenit(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function jamTitik(hhmm: string): string {
  return hhmm.replace(':', '.');
}

function tambahHari(tanggal: string, n: number): string {
  const d = new Date(`${tanggal}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export interface StatusToko {
  buka: boolean;
  teks: string;
  keterangan?: string;
}

export function statusToko(cfg: ConfigToko, kini: Date): StatusToko {
  const { tanggal, menit } = bagianWib(kini, cfg.zonaWaktu || TZ);
  const khusus = (tanggal: string) => cfg.tutupKhusus.find((x) => x.tanggal === tanggal);
  const buka = keMenit(cfg.jamBuka);
  const tutup = keMenit(cfg.jamTutup);
  const jb = jamTitik(cfg.jamBuka);

  const libur = khusus(tanggal);
  if (libur) return { buka: false, teks: 'Tutup hari ini', keterangan: libur.keterangan };
  if (menit >= buka && menit < tutup) return { buka: true, teks: `Buka sekarang, tutup pukul ${jamTitik(cfg.jamTutup)} WIB` };
  if (menit < buka) return { buka: false, teks: `Tutup sekarang, buka hari ini pukul ${jb}` };

  // setelah jam tutup: cari hari buka berikutnya
  for (let i = 1; i <= 31; i++) {
    const t = tambahHari(tanggal, i);
    if (!khusus(t)) {
      if (i === 1) return { buka: false, teks: `Tutup sekarang, buka lagi besok pukul ${jb}` };
      const nama = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
        new Date(`${t}T12:00:00Z`),
      );
      return { buka: false, teks: `Tutup sekarang, buka lagi ${nama} pukul ${jb}` };
    }
  }
  return { buka: false, teks: 'Tutup sekarang' };
}
