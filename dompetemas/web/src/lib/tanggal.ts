export function tanggalId(iso: string | null | undefined): string {
  if (!iso) return 'tanggal tidak diketahui';
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00+07:00' : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}
export function tahunWib(): number {
  return Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric' }).format(new Date()));
}
