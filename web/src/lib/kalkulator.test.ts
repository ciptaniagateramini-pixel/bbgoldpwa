import { describe, expect, it } from 'vitest';
import { POLOS, bulatBawahRibu, daftarKadar, hitungEstimasi, normalisasiWa, parseBerat, pertanyaanLangkah2 } from './kalkulator';
import { hargaBerlakuHariIni, statusToko } from './waktu';
import { labelKadar, rupiah } from './format';
import type { ItemHarga } from './types';

const items: ItemHarga[] = [
  { kadar: '300', jenis: 'Lokal', hargaPerGram: 592500 },
  { kadar: '300', jenis: 'Cap Pabrik', hargaPerGram: 660000 },
  { kadar: '375', jenis: 'Pabrik', hargaPerGram: 795000 },
  { kadar: '420', jenis: '-', hargaPerGram: 907500 },
  { kadar: '700', jenis: 'Cap Pabrik', hargaPerGram: 1537500 },
  { kadar: '700', jenis: 'Lokal', hargaPerGram: 1470000 },
  { kadar: '750', jenis: 'Kuning', hargaPerGram: 1627500 },
  { kadar: '750', jenis: 'Putih', hargaPerGram: 1582500 },
  { kadar: '14K', jenis: '-', hargaPerGram: 1245000 },
];

describe('pilihan kalkulator dari Sheet', () => {
  it('kadar unik urut Sheet', () => {
    expect(daftarKadar(items)).toEqual(['300', '375', '420', '700', '750', '14K']);
  });
  it('label chip', () => {
    expect(labelKadar('300')).toBe('KODE 300');
    expect(labelKadar('14K')).toBe('14K');
    expect(labelKadar('80%')).toBe('80%');
  });
  it('langkah 2: cap untuk 300/700, warna untuk 750, lewati untuk satu jenis', () => {
    expect(pertanyaanLangkah2(items, '300')).toEqual({ tipe: 'cap', capPabrik: 'Cap Pabrik', lokal: 'Lokal' });
    expect(pertanyaanLangkah2(items, '700').tipe).toBe('cap');
    expect(pertanyaanLangkah2(items, '750')).toEqual({ tipe: 'warna', pilihan: ['Kuning', 'Putih'] });
    expect(pertanyaanLangkah2(items, '375')).toEqual({ tipe: 'lewati', jenis: 'Pabrik' });
    expect(pertanyaanLangkah2(items, '420')).toEqual({ tipe: 'lewati', jenis: '-' });
  });
  it('ikut berubah bila pemilik menambah baris', () => {
    const tambah = [...items, { kadar: '916', jenis: 'Lokal', hargaPerGram: 2000000 }, { kadar: '916', jenis: 'Cap Pabrik', hargaPerGram: 2010000 }];
    expect(daftarKadar(tambah)).toContain('916');
    expect(pertanyaanLangkah2(tambah, '916').tipe).toBe('cap');
  });
});

describe('estimasi', () => {
  it('dibulatkan ke bawah ke Rp1.000', () => {
    expect(bulatBawahRibu(1234999)).toBe(1234000);
    expect(hitungEstimasi(items, '700', 'Lokal', 2.37)).toEqual({ tipe: 'tunggal', nilai: 3483000, hargaPerGram: 1470000 });
  });
  it('polos: rentang Lokal terendah sampai tertinggi', () => {
    expect(hitungEstimasi(items, POLOS, '', 2)).toEqual({ tipe: 'rentang', min: 1185000, max: 2940000 });
  });
  it('polos tanpa baris Lokal: tanpa angka', () => {
    expect(hitungEstimasi(items.filter((i) => i.jenis !== 'Lokal'), POLOS, '', 2)).toEqual({ tipe: 'tanpa-angka' });
  });
  it('berat tidak valid', () => {
    expect(hitungEstimasi(items, '700', 'Lokal', 0)).toBeNull();
    expect(parseBerat('3,25')).toBe(3.25);
    expect(parseBerat('0')).toBeNull();
    expect(parseBerat('abc')).toBeNull();
    expect(parseBerat('1,234')).toBeNull();
  });
  it('rupiah', () => {
    expect(rupiah(1234000)).toBe('Rp 1.234.000');
  });
});

describe('nomor WhatsApp', () => {
  it('dinormalisasi ke +62', () => {
    expect(normalisasiWa('0812-3456-7890')).toBe('+6281234567890');
    expect(normalisasiWa('+62 812 3456 7890')).toBe('+6281234567890');
    expect(normalisasiWa('6281234567890')).toBe('+6281234567890');
    expect(normalisasiWa('81234567890')).toBe('+6281234567890');
  });
  it('menolak nomor tidak valid', () => {
    expect(normalisasiWa('021-555-1234')).toBeNull();
    expect(normalisasiWa('0812')).toBeNull();
    expect(normalisasiWa('abc')).toBeNull();
  });
});

describe('aturan basi (hari kalender WIB)', () => {
  it('berlaku pada hari yang sama di WIB', () => {
    expect(hargaBerlakuHariIni('2026-11-13T09:15:00+07:00', new Date('2026-11-13T16:59:00Z'))).toBe(true); // 23.59 WIB
  });
  it('basi setelah tengah malam WIB walau di UTC masih tanggal sama', () => {
    expect(hargaBerlakuHariIni('2026-11-13T09:15:00+07:00', new Date('2026-11-13T17:01:00Z'))).toBe(false); // 00.01 WIB tgl 14
  });
  it('kosong = belum ditetapkan', () => {
    expect(hargaBerlakuHariIni(null, new Date())).toBe(false);
  });
});

describe('status buka/tutup (WIB, bukan jam perangkat)', () => {
  const cfg = { zonaWaktu: 'Asia/Jakarta', jamBuka: '09:00', jamTutup: '17:00', tutupKhusus: [] as { tanggal: string; keterangan: string }[] };
  const wib = (s: string) => new Date(`${s}+07:00`);
  it('buka', () => expect(statusToko(cfg, wib('2026-11-13T10:00:00')).buka).toBe(true));
  it('sebelum buka', () => expect(statusToko(cfg, wib('2026-11-13T08:59:00')).teks).toBe('Tutup sekarang, buka hari ini pukul 09.00'));
  it('setelah tutup', () => expect(statusToko(cfg, wib('2026-11-13T17:00:00')).teks).toBe('Tutup sekarang, buka lagi besok pukul 09.00'));
  it('tanggal tutup khusus', () => {
    const c = { ...cfg, tutupKhusus: [{ tanggal: '2026-12-25', keterangan: 'Libur Natal' }] };
    expect(statusToko(c, wib('2026-12-25T10:00:00'))).toEqual({ buka: false, teks: 'Tutup hari ini', keterangan: 'Libur Natal' });
    expect(statusToko(c, wib('2026-12-24T18:00:00')).teks).toMatch(/^Tutup sekarang, buka lagi Sabtu, 26 Desember pukul 09.00$/);
  });
});
