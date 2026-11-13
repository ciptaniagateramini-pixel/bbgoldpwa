import { TOKO } from '../lib/konten';

/** Draf. Redaksi final wajib dicek pemilik/penasihat hukum (UU 27/2022 tentang Pelindungan Data Pribadi). */
export function Privasi() {
  const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-5 font-semibold text-mustard-muda">{children}</h2>;
  return (
    <article className="space-y-2 leading-relaxed text-krem/90">
      <h1 className="text-2xl font-semibold text-krem">Kebijakan privasi</h1>
      <p className="text-sm text-krem/70">Berlaku sejak 13 November 2026.</p>
      <H>Siapa kami</H>
      <p>BB GOLD, toko jual beli emas di {TOKO.alamat}. Kontak: WhatsApp {TOKO.waTampil}, email {TOKO.email}.</p>
      <H>Data yang kami kumpulkan</H>
      <p>Hanya saat kamu memakai kalkulator estimasi dan mengisi formulir: nama, nomor WhatsApp, email (bila diisi), serta isian kalkulator (kode, cap/jenis, berat, ada permata atau tidak, dan hasil estimasi), dan dari mana kamu membuka situs ini (misalnya Instagram). Harga, grafik, dan referensi bisa dilihat tanpa mengisi data apa pun.</p>
      <H>Tujuan</H>
      <p>Data dipakai hanya untuk menindaklanjuti estimasi yang kamu minta, misalnya menghubungi kamu lewat WhatsApp untuk menjawab pertanyaan atau mengatur kedatangan ke toko. Kami tidak mengirim pesan promosi massal tanpa persetujuan terpisah, dan tidak menjual atau membagikan data kamu ke pihak lain.</p>
      <H>Penyimpanan dan lama simpan</H>
      <p>Data disimpan di lembar kerja Google milik pemilik BB GOLD yang tidak dibuka untuk umum. Data disimpan paling lama 12 bulan sejak kontak terakhir, lalu dihapus. Untuk mencegah spam, alamat IP diubah menjadi kode acak (hash) dan dibuang paling lama dalam 24 jam; alamat IP asli tidak disimpan.</p>
      <p>Di perangkat kamu, situs ini menyimpan harga terakhir (agar bisa dibuka saat offline), kode perangkat acak untuk pembatasan kiriman, dan hasil estimasi selama sesi berjalan.</p>
      <H>Hak kamu</H>
      <p>Kamu bisa meminta melihat, memperbaiki, atau menghapus data kamu, dan menarik persetujuan kapan saja. Kirim permintaan lewat WhatsApp {TOKO.waTampil} atau email {TOKO.email} dengan menyebut nama dan nomor yang dipakai. Kami proses paling lama 3 x 24 jam hari kerja.</p>
    </article>
  );
}
