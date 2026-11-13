import { CATATAN_WAJIB } from '../lib/konten';

/** Catatan wajib: tidak boleh disembunyikan, dilipat, atau dikecilkan. */
export function CatatanWajib() {
  return (
    <div role="note" className="grid grid-cols-[40px_1fr] items-center gap-2.5 rounded-[18px] border-2 border-mustard bg-krem px-4 py-3.5 text-biru">
      <svg viewBox="0 0 100 100" className="h-10 w-10" aria-hidden="true"><use href="#hex" /></svg>
      <span data-testid="catatan-wajib" className="text-[15px] font-extrabold leading-snug tracking-wide">{CATATAN_WAJIB}</span>
    </div>
  );
}
