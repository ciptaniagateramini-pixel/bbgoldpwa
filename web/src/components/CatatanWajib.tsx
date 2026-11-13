import { CATATAN_WAJIB } from '../lib/konten';

/** Catatan wajib: tidak boleh disembunyikan, dilipat, atau dikecilkan. */
export function CatatanWajib() {
  return (
    <div data-testid="catatan-wajib" role="note" className="rounded-2xl border-2 border-biru bg-mustard px-4 py-4 text-center text-base font-bold leading-snug tracking-wide text-biru sm:text-lg">
      {CATATAN_WAJIB}
    </div>
  );
}
