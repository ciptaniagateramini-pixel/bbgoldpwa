import { Link } from 'react-router-dom';
export function NotFound() {
  return (
    <div className="space-y-3 py-10 text-center">
      <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
      <Link to="/" className="tombol-mustard">Kembali ke beranda</Link>
    </div>
  );
}
