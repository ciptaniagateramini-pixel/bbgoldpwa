import { describe, expect, it } from 'vitest';
import { analisis, daftarPecahan, gramDari, nilaiHariIni, normalPecahan, persen, rp, type Aset, type DataHarga } from './hitung';

const H: DataHarga = {
  perhiasan: { ditetapkanPada: '2026-11-13T12:26:00+07:00', items: [
    { kadar: '700', jenis: 'Lokal', hargaPerGram: 1422150 },
    { kadar: '750', jenis: 'Kuning', hargaPerGram: 1590975 },
  ] },
  batangan: {
    antam: { tanggal: '2026-11-13', basi: false, items: [{ label: '1 gram', harga: 2293000 }] },
    ubs: { tanggal: '2026-11-13', basi: false, items: [{ label: '1 g', harga: 2256000 }, { label: '2 g', harga: 4512000 }, { label: '0,5 g', harga: 1128000 }] },
    hartadinata: null,
  },
  diambilPada: '', waktuServer: '',
};
const per = (o: Partial<Aset>): Aset => ({ jenis: 'perhiasan', nama: '', bentuk: 'Cincin', kadar: '700', sub: 'Lokal', berat: 3.2, merek: null, pecahan: null, keping: null, tahun: 2021, harga_beli: 2400000, ...o });
const bat = (o: Partial<Aset>): Aset => ({ jenis: 'batangan', nama: '', bentuk: null, kadar: null, sub: null, berat: null, merek: 'Antam', pecahan: '5 g', keping: 1, tahun: 2022, harga_beli: 4700000, ...o });

describe('nilai hari ini', () => {
  it('perhiasan = berat × harga per gram, dibulatkan ke bawah Rp1.000', () => {
    expect(nilaiHariIni(per({}), H)).toBe(4550000); // 3,2 × 1.422.150 = 4.550.880
  });
  it('perhiasan tanpa harga kadar -> null', () => {
    expect(nilaiHariIni(per({ kadar: '916', sub: '-' }), H)).toBeNull();
  });
  it('Antam memakai harga per gram × berat pecahan × keping', () => {
    expect(nilaiHariIni(bat({ pecahan: '5 g', keping: 2 }), H)).toBe(22930000);
  });
  it('UBS memakai tabel pecahan bila ada', () => {
    expect(nilaiHariIni(bat({ merek: 'UBS', pecahan: '2 g', keping: 2 }), H)).toBe(9024000);
    expect(nilaiHariIni(bat({ merek: 'UBS', pecahan: '0,5 g' }), H)).toBe(1128000);
  });
  it('UBS pecahan di luar tabel -> 1 g × berat', () => {
    expect(nilaiHariIni(bat({ merek: 'UBS', pecahan: '10 g' }), H)).toBe(22560000);
  });
  it('sumber tidak ada -> null', () => {
    expect(nilaiHariIni(bat({ merek: 'Hartadinata', pecahan: '1 g' }), H)).toBeNull();
  });
});

describe('untung rugi', () => {
  it('untung rupiah, persen, rata-rata per tahun', () => {
    const a = analisis(per({}), H, 2026);
    expect(a.selisih).toBe(2150000);
    expect(a.persen!).toBeCloseTo(0.8958, 3);
    expect(a.tahun).toBe(5);
    expect(a.perTahun!).toBeCloseTo(Math.pow(4550000 / 2400000, 1 / 5) - 1, 6);
  });
  it('rugi negatif', () => {
    const a = analisis(per({ kadar: '750', sub: 'Kuning', berat: 5, harga_beli: 9500000, tahun: 2025 }), H, 2026);
    expect(a.selisih).toBe(7954000 - 9500000);
    expect(a.persen! < 0).toBe(true);
  });
  it('kurang dari 1 tahun: tanpa rata-rata per tahun', () => {
    expect(analisis(per({ tahun: 2026 }), H, 2026).perTahun).toBeNull();
  });
  it('format', () => {
    expect(rp(-1546000)).toBe('−Rp 1.546.000');
    expect(persen(0.896)).toBe('+89,6%');
    expect(persen(-0.1627)).toBe('−16,3%');
  });
});

describe('pecahan', () => {
  it('normalisasi label', () => {
    expect(normalPecahan('1 gram')).toBe('1 g');
    expect(normalPecahan('0,25 gr')).toBe('0,25 g');
    expect(gramDari('0,5 g')).toBe(0.5);
  });
  it('daftar pecahan dari referensi', () => {
    expect(daftarPecahan(H, 'UBS')).toEqual(['1 g', '2 g', '0,5 g']);
    expect(daftarPecahan(H, 'Antam')).toContain('100 g');
  });
});
