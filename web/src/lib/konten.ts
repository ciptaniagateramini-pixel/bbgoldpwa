/** Teks wajib & data toko. Jangan diubah tanpa persetujuan pemilik. */
export const CATATAN_WAJIB = 'PERHIASAN RUSAK, PATAH, SURAT HILANG TIDAK ADA POTONGAN.';
export const KETERANGAN_ESTIMASI =
  'Ini hanya estimasi. Hasil sebenarnya bisa berbeda setelah perhiasan diverifikasi dan dicek langsung di toko. Yang bisa membuat hasil berbeda: (1) kesesuaian berat emas, (2) berat aksesoris dan permata, (3) kadar emas.';
export const KETERANGAN_BERAT =
  'Berat permata dan aksesoris tidak masuk dalam berat timbangan emas. Estimasi dihitung dari berat emasnya saja. Berat final ditentukan saat ditimbang di toko.';
export const KETERANGAN_POLOS = 'Perhiasan polos perlu diuji kadarnya di toko. Ini hanya perkiraan golongan Lokal.';
export const SLOGAN = 'Jual dan beli transparan, gak bikin kamu penasaran';

export const TOKO = {
  nama: 'BB GOLD',
  waNomor: '62882000119208',
  waTampil: '0882-0001-19208',
  email: 'customerservice@dwabussines.com',
  alamat:
    'Jl. Raya Sukatani, RT.021 RW.006, Kp. Cikadu, Kec. Sukatani, Kabupaten Purwakarta, Jawa Barat 41167',
  mapsRute: 'https://share.google/R8FAONEEQlCiFZA75',
  catatanMaps:
    'BB GOLD berlokasi di alamat ini (profil Google Maps tercatat atas nama PT Drajat Wiguna Adidaya / DWA)',
  jamTampil: 'Buka setiap hari, 09.00 - 17.00 WIB',
};

export function waLink(pesan: string): string {
  return `https://wa.me/${TOKO.waNomor}?text=${encodeURIComponent(pesan)}`;
}

export function mapsEmbedUrl(): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(TOKO.alamat)}&output=embed`;
}
