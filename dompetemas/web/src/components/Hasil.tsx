import { analisis, beratEmas, koma, persen, rp, type Aset, type DataHarga } from '../lib/hitung';
import { tahunWib, tanggalId } from '../lib/tanggal';

export function sumberHarga(a: Aset, h: DataHarga | null): string {
  if (!h) return '';
  if (a.jenis === 'perhiasan') return `harga referensi BB GOLD Purwakarta per ${tanggalId(h.perhiasan.ditetapkanPada)}`;
  const s = h.batangan[(a.merek ?? '').toLowerCase() as 'antam'];
  return `buyback resmi ${a.merek} per ${tanggalId(s?.tanggal)}`;
}

export function Hasil({ aset, harga }: { aset: Aset; harga: DataHarga | null }) {
  const a = analisis(aset, harga, tahunWib());
  if (a.nilai === null || a.selisih === null || a.persen === null) {
    return <p className="info" data-testid="hasil-tanpa-harga">Harga referensi untuk emas ini belum tersedia, jadi untung/ruginya belum bisa dihitung.</p>;
  }
  const naik = a.selisih >= 0;
  const k = naik ? 'naik' : 'turun';
  return (
    <div style={{ display: 'grid', gap: 14 }} data-testid="hasil">
      <div style={{ textAlign: 'center' }}>
        <div className="kecil">{naik ? 'Perkiraan untung jika dijual hari ini' : 'Perkiraan rugi jika dijual hari ini'}</div>
        <div className={`besar-angka ${k}`} data-testid="hasil-selisih">{naik ? '+' : ''}{rp(a.selisih)}</div>
        <span className={`pil ${k}`} data-testid="hasil-persen">{naik ? '▲ ' : '▼ '}{persen(a.persen)}</span>
      </div>
      <dl className="rinci">
        <dt>Nilai jual hari ini</dt><dd data-testid="hasil-nilai">± {rp(a.nilai)}</dd>
        <dt>Harga beli</dt><dd>{rp(aset.harga_beli)}</dd>
        <dt>Berat emas</dt><dd>{koma(beratEmas(aset))} g</dd>
        <dt>Lama simpan</dt><dd>{a.tahun < 1 ? 'kurang dari 1 tahun' : `${a.tahun} tahun`}</dd>
        {a.perTahun !== null && <><dt>Rata-rata per tahun</dt><dd>{persen(a.perTahun)}</dd></>}
      </dl>
      {aset.jenis === 'perhiasan' && !naik && (
        <div className="info">Wajar kalau perhiasan terlihat rugi: harga belinya sudah termasuk ongkos bikin dan keuntungan toko, sedangkan nilai jualnya dihitung dari emasnya saja.</div>
      )}
      <p className="kecil">Perkiraan berdasarkan {sumberHarga(aset, harga)}. Hasil di toko bisa berbeda setelah dicek kadar dan beratnya.</p>
    </div>
  );
}
