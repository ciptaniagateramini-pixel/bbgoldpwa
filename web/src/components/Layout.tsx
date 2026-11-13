import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { LogoSel } from './Logo';
import { IkonBuku, IkonKalkulator, IkonRumah, IkonToko } from './Ikon';
import { SLOGAN, TOKO } from '../lib/konten';
import { useHarga } from '../lib/HargaContext';

const menu = [
  { to: '/', label: 'Beranda', Ikon: IkonRumah },
  { to: '/kalkulator', label: 'Kalkulator', Ikon: IkonKalkulator },
  { to: '/edukasi', label: 'Edukasi', Ikon: IkonBuku },
  { to: '/toko', label: 'Toko', Ikon: IkonToko },
];

export function Layout() {
  const { pathname } = useLocation();
  const { offline } = useHarga();
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <div className="relative min-h-screen bg-biru pb-24 text-krem">
      <div className="pola-sarang pointer-events-none absolute right-0 top-0 h-80 w-80" aria-hidden="true" />
      <header className="relative mx-auto flex max-w-3xl items-center gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/" className="flex items-center gap-3" aria-label="BB GOLD, ke beranda">
          <LogoSel className="h-11 w-11" />
          <div>
            <div className="text-xl font-semibold lowercase leading-none tracking-wide">bb gold</div>
            <div className="text-[11px] uppercase tracking-[.2em] text-mustard-muda">Jual beli emas · Purwakarta</div>
          </div>
        </Link>
        <nav className="ml-auto hidden gap-1 sm:flex" aria-label="Menu utama">
          {menu.map((m) => (
            <NavLink key={m.to} to={m.to} end className={({ isActive }) => `flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium ${isActive ? 'bg-mustard text-biru' : 'text-krem/85 hover:bg-white/10'}`}>
              {m.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {offline && (
        <div role="status" className="relative mx-auto mt-2 max-w-3xl px-4">
          <div className="rounded-xl border border-mustard/60 bg-biru-2 px-4 py-2 text-sm text-mustard-muda">
            Mode offline: menampilkan data tersimpan terakhir di perangkat ini.
          </div>
        </div>
      )}

      <main className="relative mx-auto max-w-3xl px-4 pt-3">
        <Outlet />
      </main>

      <footer className="relative mx-auto mt-10 max-w-3xl px-4 text-sm text-krem/75">
        <p className="font-medium text-mustard-muda">“{SLOGAN}”</p>
        <p className="mt-2">{TOKO.alamat}</p>
        <p className="mt-1">WhatsApp <a href={`https://wa.me/${TOKO.waNomor}`} target="_blank" rel="noopener" className="inline-block py-2 underline">{TOKO.waTampil}</a> · {TOKO.jamTampil}</p>
        <p className="mt-1"><Link to="/privasi" className="inline-flex min-h-[44px] items-center underline">Kebijakan privasi</Link></p>
      </footer>

      <nav aria-label="Menu bawah" className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-biru/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {menu.map(({ to, label, Ikon }) => (
            <li key={to}>
              <NavLink to={to} end className={({ isActive }) => `flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-medium ${isActive ? 'text-mustard' : 'text-krem/75'}`}>
                <Ikon className="h-6 w-6" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
