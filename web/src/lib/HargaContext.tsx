import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ambilHarga, kirimUlangAntrean } from './api';
import type { ConfigToko, DataHarga } from './types';
import { hargaBerlakuHariIni, sekarang } from './waktu';

interface Nilai {
  memuat: boolean;
  data: DataHarga | null;
  offline: boolean;
  berlaku: boolean; // harga ditetapkan untuk hari ini (WIB)
  toko: ConfigToko;
}

const TOKO_DEFAULT: ConfigToko = { zonaWaktu: 'Asia/Jakarta', jamBuka: '09:00', jamTutup: '17:00', tutupKhusus: [] };
const Ctx = createContext<Nilai>({ memuat: true, data: null, offline: false, berlaku: false, toko: TOKO_DEFAULT });

export function HargaProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Nilai>({ memuat: true, data: null, offline: false, berlaku: false, toko: TOKO_DEFAULT });

  useEffect(() => {
    let batal = false;
    const muat = async () => {
      const h = await ambilHarga();
      if (batal) return;
      setS((p) => ({ ...p, memuat: false, data: h.data, offline: h.offline, berlaku: !!h.data && hargaBerlakuHariIni(h.data.ditetapkanPada, sekarang()) }));
    };
    void muat();
    fetch('/config/toko.json')
      .then((r) => r.json())
      .then((t: ConfigToko) => !batal && Array.isArray(t.tutupKhusus) && setS((p) => ({ ...p, toko: { ...TOKO_DEFAULT, ...t } })))
      .catch(() => {});
    void kirimUlangAntrean();
    const online = () => { void muat(); void kirimUlangAntrean(); };
    const fokus = () => document.visibilityState === 'visible' && void muat();
    window.addEventListener('online', online);
    document.addEventListener('visibilitychange', fokus);
    return () => {
      batal = true;
      window.removeEventListener('online', online);
      document.removeEventListener('visibilitychange', fokus);
    };
  }, []);

  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}

export const useHarga = () => useContext(Ctx);
