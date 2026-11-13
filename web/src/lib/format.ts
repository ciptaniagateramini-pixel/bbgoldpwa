const TZ = 'Asia/Jakarta';

export function rupiah(n: number): string {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID').replace(/,/g, '.');
}

/** "13 Nov 2026, 09.15 WIB" */
export function tanggalJam(iso: string): string {
  const d = new Date(iso);
  const tgl = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  const jam = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
    .format(d)
    .replace(':', '.');
  return `${tgl}, ${jam} WIB`;
}

export function tanggalSaja(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );
}

/** Label chip kadar: angka 3 digit -> "KODE 300"; selain itu apa adanya ("14K", "80%"). */
export function labelKadar(kadar: string): string {
  return /^\d{3}$/.test(kadar) ? `KODE ${kadar}` : kadar;
}

export function beratTampil(g: number): string {
  return g.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}
