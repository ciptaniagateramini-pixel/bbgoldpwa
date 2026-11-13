/**
 * Artikel edukasi v1. bank-ide-edukasi.md belum tersedia saat dibuat:
 * isi ini draf umum, mohon dicek/diganti pemilik.
 */
export interface Artikel {
  slug: string;
  judul: string;
  ringkas: string;
  isi: string[]; // paragraf
}

export const ARTIKEL: Artikel[] = [
  {
    slug: 'kode-dan-cap-pabrik',
    judul: 'Apa itu kode dan cap pabrik?',
    ringkas: 'Dua tanda kecil di perhiasan yang membantu menaksir nilainya.',
    isi: [
      'Kode adalah angka kecil yang tercetak di perhiasan, misalnya 375, 700, 750, atau 916. Angka ini menunjukkan perkiraan kandungan emas. Ada juga yang ditulis dalam karat (misalnya 22K) atau persen (misalnya 80%).',
      'Cari kode di bagian dalam cincin, di belakang liontin, atau di dekat kait kalung dan gelang. Hurufnya sangat kecil, jadi pakai senter HP atau kaca pembesar.',
      'Cap pabrik adalah tanda merek pabrik yang tercetak di perhiasan, misalnya UBS, Diamond, Lotus, HTM, dan lainnya. Perhiasan yang punya cap pabrik biasanya dibuat dengan standar kadar pabrik tersebut.',
      'Perhiasan tanpa cap pabrik disebut perhiasan lokal. Perhiasan tanpa kode dan tanpa cap (polos) perlu diuji kadarnya di toko supaya nilainya bisa ditentukan dengan tepat.',
    ],
  },
  {
    slug: 'membaca-kode-kadar',
    judul: 'Cara membaca angka kode kadar',
    ringkas: 'Arti angka 375, 700, 750, dan 916 secara umum.',
    isi: [
      'Angka kode tiga digit menunjukkan kandungan emas per seribu bagian. Contohnya, 750 berarti sekitar 750 bagian emas dari 1.000 bagian logam, atau sekitar 75 persen.',
      'Kode karat (K) memakai skala 24. Emas 24K adalah emas yang paling murni, sedangkan 18K berarti sekitar 18 dari 24 bagian adalah emas.',
      'Kode di perhiasan adalah petunjuk awal. Kadar sebenarnya dipastikan saat perhiasan dicek langsung di toko.',
    ],
  },
  {
    slug: 'berat-permata',
    judul: 'Kenapa berat permata tidak dihitung?',
    ringkas: 'Yang dinilai adalah berat emasnya saja.',
    isi: [
      'Saat perhiasan dijual kembali, yang dinilai adalah emasnya. Permata, batu, mutiara, atau aksesoris lain bukan emas, sehingga beratnya tidak masuk dalam berat timbangan emas.',
      'Karena itu kalkulator menghitung estimasi dari berat emas saja. Berat final ditentukan saat perhiasan ditimbang di toko, dan kamu bisa melihat timbangannya langsung.',
    ],
  },
  {
    slug: 'buyback-resmi-vs-toko',
    judul: 'Beda harga buyback resmi dan harga toko',
    ringkas: 'Kenapa harga Antam atau UBS tidak sama dengan harga perhiasan.',
    isi: [
      'Harga buyback resmi Antam, UBS, Hartadinata, dan merek lain berlaku untuk emas batangan merek tersebut, dijual kembali sesuai ketentuan masing-masing merek.',
      'Perhiasan punya kadar yang berbeda-beda, jadi harganya dihitung per kadar. Di BB GOLD, harga buyback perhiasan per gram ditetapkan setiap hari dan ditampilkan di halaman depan.',
      'Grafik emas dunia (XAU/USD) menunjukkan arah harga pasar internasional dalam dolar per troy ounce. Grafik itu informasi pasar, bukan harga BB GOLD.',
    ],
  },
  {
    slug: 'perhiasan-rusak',
    judul: 'Perhiasan rusak atau surat hilang?',
    ringkas: 'Tetap bisa dijual di BB GOLD.',
    isi: [
      'PERHIASAN RUSAK, PATAH, SURAT HILANG TIDAK ADA POTONGAN.',
      'Bawa perhiasanmu ke toko. Kami cek kadar dan timbang beratnya di depan kamu, lalu nilainya dihitung dari harga per gram yang berlaku hari itu.',
    ],
  },
];
