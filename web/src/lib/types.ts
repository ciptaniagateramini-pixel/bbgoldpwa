export interface ItemHarga {
  kadar: string;
  jenis: string;
  hargaPerGram: number;
}

export interface DataHarga {
  ok: true;
  ditetapkanPada: string | null;
  items: ItemHarga[];
  waktuServer: string;
  diambilPada: string;
  dariCacheLama?: boolean;
}

export interface SumberReferensi {
  tanggal: string | null;
  keterangan: string;
  basi: boolean;
  items: { label: string; harga: number }[];
}

export interface DataReferensi {
  ok: true;
  hartadinata: SumberReferensi | null;
  antam: SumberReferensi | null;
  ubs: SumberReferensi | null;
  redmark: SumberReferensi | null;
  waktuServer: string;
}

export interface ConfigToko {
  zonaWaktu: string;
  jamBuka: string; // "09:00"
  jamTutup: string; // "17:00"
  tutupKhusus: { tanggal: string; keterangan: string }[];
}
