import { useEffect, type ReactNode } from 'react';

export function Lembar({ buka, tutup, judul, children }: { buka: boolean; tutup: () => void; judul: string; children: ReactNode }) {
  useEffect(() => {
    if (!buka) return;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && tutup();
    addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; removeEventListener('keydown', esc); };
  }, [buka, tutup]);
  if (!buka) return null;
  return (
    <>
      <div className="tirai" onClick={tutup} />
      <div className="lembar" role="dialog" aria-modal="true" aria-label={judul}>
        <div className="isi"><div className="pegangan" />{children}</div>
      </div>
    </>
  );
}
