import { useEffect, useRef, useState } from 'react';

/**
 * Widget gratis TradingView "Symbol Overview" untuk OANDA:XAUUSD.
 * Branding TradingView wajib tetap tampil (paket gratis). Data bisa tertunda: jangan sebut "real time".
 * Dimuat lambat: hanya setelah blok harga toko tampil (prop siap) dan blok terlihat di layar.
 */
const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';

export function GrafikEmas({ siap }: { siap: boolean }) {
  const kotak = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'menunggu' | 'memuat' | 'tampil' | 'gagal'>('menunggu');

  useEffect(() => {
    if (!siap || status !== 'menunggu' || !kotak.current) return;
    const el = kotak.current;
    const mulai = () => {
      if (!navigator.onLine) return setStatus('gagal');
      setStatus('memuat');
      const s = document.createElement('script');
      s.src = SCRIPT;
      s.async = true;
      s.onerror = () => setStatus('gagal');
      s.text = JSON.stringify({
        symbols: [['Emas XAU/USD', 'OANDA:XAUUSD|1M']],
        chartOnly: false,
        width: '100%',
        height: '100%',
        locale: 'id',
        colorTheme: 'dark',
        autosize: true,
        showVolume: false,
        showMA: false,
        hideDateRanges: false,
        hideMarketStatus: false,
        hideSymbolLogo: true,
        scalePosition: 'right',
        scaleMode: 'Normal',
        fontFamily: 'Poppins, sans-serif',
        fontColor: '#FBF7EC',
        gridLineColor: 'rgba(251, 247, 236, 0.08)',
        backgroundColor: '#082A59',
        chartType: 'area',
        lineColor: '#E5B527',
        topColor: 'rgba(229, 181, 39, 0.35)',
        bottomColor: 'rgba(229, 181, 39, 0)',
        lineWidth: 2,
        dateRanges: ['1d|15', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
      });
      el.querySelector('.tradingview-widget-container__widget')?.after(s);
      // bila iframe tidak muncul dalam 15 detik, tampilkan kartu cadangan
      const t = window.setTimeout(() => setStatus((x) => (el.querySelector('iframe') ? 'tampil' : x === 'memuat' ? 'gagal' : x)), 15000);
      const mo = new MutationObserver(() => {
        if (el.querySelector('iframe')) { setStatus('tampil'); mo.disconnect(); window.clearTimeout(t); }
      });
      mo.observe(el, { childList: true, subtree: true });
    };
    const io = new IntersectionObserver((e) => {
      if (e.some((x) => x.isIntersecting)) { io.disconnect(); mulai(); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [siap, status]);

  useEffect(() => {
    const off = () => status !== 'tampil' && setStatus('gagal');
    window.addEventListener('offline', off);
    return () => window.removeEventListener('offline', off);
  }, [status]);

  return (
    <section aria-labelledby="judul-grafik" className="space-y-2">
      <h2 id="judul-grafik" className="judul-blok">Harga emas dunia (XAU/USD, dolar per troy ounce)</h2>
      <p className="text-sm text-krem/80">Informasi pasar dunia. Bukan harga BB GOLD. Harga buyback BB GOLD ditetapkan setiap hari di toko.</p>
      <div className="relative h-[340px] overflow-hidden rounded-2xl border border-white/10 bg-biru-2">
        {status === 'gagal' ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-krem/80" data-testid="grafik-cadangan">
            Grafik tidak tersedia saat offline
          </div>
        ) : (
          <div ref={kotak} className="tradingview-widget-container h-full" data-testid="grafik-widget">
            <div className="tradingview-widget-container__widget h-[calc(100%-28px)]" />
            <div className="tradingview-widget-copyright px-3 text-xs text-krem/70">
              <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" className="underline">
                Grafik oleh TradingView
              </a>
            </div>
            {status !== 'tampil' && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-krem/60" aria-hidden="true">Memuat grafik…</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
