import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { LogoSel } from './Logo';
import { BibiDefs } from './Bibi';
import { IkonBuku, IkonKalkulator, IkonRumah, IkonToko } from './Ikon';
import { SLOGAN, TOKO, waLink } from '../lib/konten';
import { useHarga } from '../lib/HargaContext';
import { sekarang, statusToko } from '../lib/waktu';

const menu = [
  { to: '/', label: 'Beranda', Ikon: IkonRumah },
  { to: '/kalkulator', label: 'Kalkulator', Ikon: IkonKalkulator },
  { to: '/edukasi', label: 'Edukasi', Ikon: IkonBuku },
  { to: '/toko', label: 'Toko', Ikon: IkonToko },
];

function PilBuka() {
  const { toko } = useHarga();
  const s = statusToko(toko, sekarang());
  const pendek = s.buka ? 'Buka sekarang' : s.teks.startsWith('Tutup hari ini') ? 'Tutup hari ini' : 'Tutup sekarang';
  return (
    <Link to="/toko" title={s.teks} className={`pil-buka ml-auto inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold ${s.buka ? 'border-mustard/50 bg-mustard/15 text-mustard-muda' : 'border-white/20 bg-white/5 text-krem/80'}`}>
      <i style={s.buka ? undefined : { background: '#F08A8A', animation: 'none' }} />
      {pendek}
    </Link>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const { offline } = useHarga();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-biru pb-28 text-krem">
      <BibiDefs />
      <div className="pola-sarang pointer-events-none absolute right-0 top-0 h-80 w-80" aria-hidden="true" />
      <header className="relative mx-auto flex max-w-3xl items-center gap-2.5 px-4 pb-1 pt-[max(0.875rem,env(safe-area-inset-top))]">
        <Link to="/" className="flex items-center gap-2.5" aria-label="BB GOLD, ke beranda">
          <LogoSel className="h-10 w-10" />
          <div>
            <div className="text-lg font-bold lowercase leading-none tracking-wide">bb gold</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[.22em] text-mustard-muda">Purwakarta</div>
          </div>
        </Link>
        <nav className="ml-6 hidden gap-1 sm:flex" aria-label="Menu utama">
          {menu.map((m) => (
            <NavLink key={m.to} to={m.to} end className={({ isActive }) => `flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium ${isActive ? 'bg-mustard text-biru' : 'text-krem/85 hover:bg-white/10'}`}>
              {m.label}
            </NavLink>
          ))}
        </nav>
        <PilBuka />
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

      <footer className="relative mx-auto mt-12 max-w-3xl border-t border-white/10 px-4 pt-6 text-sm text-krem/75">
        <div className="flex items-center gap-2.5">
          <LogoSel className="h-8 w-8" />
          <p className="m-0 font-medium text-mustard-muda">“{SLOGAN}”</p>
        </div>
        <p className="mt-3">{TOKO.alamat}</p>
        <p className="mt-1">
          WhatsApp <a href={`https://wa.me/${TOKO.waNomor}`} target="_blank" rel="noopener" className="inline-block py-2 underline">{TOKO.waTampil}</a> · {TOKO.jamTampil}
        </p>
        <p className="mt-1"><Link to="/privasi" className="inline-flex min-h-[44px] items-center underline">Kebijakan privasi</Link></p>
        <p className="mt-4 pb-2 text-xs font-semibold uppercase tracking-[.14em] text-krem/60" data-testid="footer-pt">
          © {new Date().getFullYear()} PT DRAJAT WIGUNA ADIDAYA
        </p>
      </footer>

      <a
        href={waLink('Halo BB GOLD, saya mau tanya harga buyback perhiasan hari ini.')}
        target="_blank"
        rel="noopener"
        aria-label="Chat WhatsApp toko"
        className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-[max(16px,env(safe-area-inset-right))] z-20 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] shadow-[0_8px_22px_rgba(0,0,0,.35)] sm:bottom-6"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="#fff" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z" /></svg>
      </a>

      <nav aria-label="Menu bawah" className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-biru/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {menu.map(({ to, label, Ikon }) => (
            <li key={to}>
              <NavLink to={to} end className={({ isActive }) => `flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold ${isActive ? 'text-mustard' : 'text-krem/75'}`}>
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
