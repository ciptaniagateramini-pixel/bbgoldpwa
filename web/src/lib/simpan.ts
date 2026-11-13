/** Akses penyimpanan perangkat yang aman (bisa gagal di mode privat). */
export function baca<T>(store: 'local' | 'session', key: string): T | null {
  try {
    const s = (store === 'local' ? localStorage : sessionStorage).getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

export function tulis(store: 'local' | 'session', key: string, v: unknown) {
  try {
    (store === 'local' ? localStorage : sessionStorage).setItem(key, JSON.stringify(v));
  } catch {
    /* abaikan */
  }
}

export function hapus(store: 'local' | 'session', key: string) {
  try {
    (store === 'local' ? localStorage : sessionStorage).removeItem(key);
  } catch {
    /* abaikan */
  }
}

export function idAcak(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function idPerangkat(): string {
  let id = baca<string>('local', 'bb_perangkat');
  if (!id) {
    id = idAcak();
    tulis('local', 'bb_perangkat', id);
  }
  return id;
}

/** Sumber kunjungan dari ?s=instagram dst; disimpan untuk sesi ini. */
export function catatSumber() {
  const s = new URLSearchParams(location.search).get('s');
  if (s && /^[a-z0-9_-]{1,30}$/i.test(s)) tulis('session', 'bb_sumber', s.toLowerCase());
}

export function sumber(): string {
  return baca<string>('session', 'bb_sumber') ?? 'langsung';
}
