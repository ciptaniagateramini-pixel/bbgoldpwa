import { Link, useParams } from 'react-router-dom';
import { ARTIKEL } from '../content/artikel';
import { CATATAN_WAJIB } from '../lib/konten';
import { CatatanWajib } from '../components/CatatanWajib';
import { NotFound } from './NotFound';

export function Edukasi() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edukasi emas</h1>
      <p className="text-sm text-krem/80">Bacaan singkat supaya kamu paham sebelum menjual perhiasan.</p>
      <ul className="space-y-3">
        {ARTIKEL.map((a) => (
          <li key={a.slug}>
            <Link to={`/edukasi/${a.slug}`} className="block rounded-2xl border border-white/10 bg-biru-2 p-4 hover:border-mustard">
              <h2 className="font-semibold text-mustard-muda">{a.judul}</h2>
              <p className="text-sm text-krem/80">{a.ringkas}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Artikel() {
  const { slug } = useParams();
  const a = ARTIKEL.find((x) => x.slug === slug);
  if (!a) return <NotFound />;
  return (
    <article className="space-y-4">
      <Link to="/edukasi" className="text-sm text-mustard-muda underline">← Semua artikel</Link>
      <h1 className="text-2xl font-semibold">{a.judul}</h1>
      {a.isi.map((p, i) => (p === CATATAN_WAJIB ? <CatatanWajib key={i} /> : <p key={i} className="leading-relaxed text-krem/90">{p}</p>))}
      <Link to="/kalkulator" className="tombol-mustard">Coba kalkulator estimasi</Link>
    </article>
  );
}
