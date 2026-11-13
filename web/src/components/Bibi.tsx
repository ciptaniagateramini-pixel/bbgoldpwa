/** Maskot "Bibi", lebah emas BB GOLD. pose: 'lambai' (melambai) atau 'diam'. */
export function BibiDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="gBadan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F8DE73" />
          <stop offset=".55" stopColor="#E5B527" />
          <stop offset="1" stopColor="#C99712" />
        </linearGradient>
        <symbol id="bibi" viewBox="0 0 120 120">
          <ellipse cx="60" cy="112" rx="26" ry="4" fill="rgba(0,0,0,.18)" />
          <path d="M50 30 C46 18 40 14 34 13" stroke="#082A59" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M70 30 C74 18 80 14 86 13" stroke="#082A59" strokeWidth="3" fill="none" strokeLinecap="round" />
          <polygon points="34,6 40,9.5 40,16.5 34,20 28,16.5 28,9.5" fill="#E5B527" stroke="#082A59" strokeWidth="2" />
          <polygon points="86,6 92,9.5 92,16.5 86,20 80,16.5 80,9.5" fill="#E5B527" stroke="#082A59" strokeWidth="2" />
          <g className="sayap"><ellipse cx="36" cy="40" rx="17" ry="11" transform="rotate(-28 36 40)" fill="#FBF7EC" fillOpacity=".85" stroke="#082A59" strokeWidth="2.5" /></g>
          <g className="sayap kanan"><ellipse cx="84" cy="40" rx="17" ry="11" transform="rotate(28 84 40)" fill="#FBF7EC" fillOpacity=".85" stroke="#082A59" strokeWidth="2.5" /></g>
          <ellipse cx="60" cy="66" rx="34" ry="36" fill="url(#gBadan)" stroke="#082A59" strokeWidth="3" />
          <path d="M29 76 Q60 86 91 76" stroke="#082A59" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M36 92 Q60 100 84 92" stroke="#082A59" strokeWidth="6" fill="none" strokeLinecap="round" />
          <ellipse cx="47" cy="56" rx="6.5" ry="8" fill="#082A59" />
          <ellipse cx="73" cy="56" rx="6.5" ry="8" fill="#082A59" />
          <circle cx="49.5" cy="53" r="2.4" fill="#fff" />
          <circle cx="75.5" cy="53" r="2.4" fill="#fff" />
          <ellipse cx="38" cy="66" rx="5" ry="3" fill="#F08A8A" fillOpacity=".55" />
          <ellipse cx="82" cy="66" rx="5" ry="3" fill="#F08A8A" fillOpacity=".55" />
          <path d="M52 66 Q60 73 68 66" stroke="#082A59" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M29 66 Q20 70 18 78" stroke="#082A59" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="tangan-lambai" viewBox="0 0 120 120">
          <path d="M91 64 Q102 56 104 44" stroke="#082A59" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="104" cy="42" r="4" fill="#E5B527" stroke="#082A59" strokeWidth="2.5" />
        </symbol>
        <symbol id="tangan-bawah" viewBox="0 0 120 120">
          <path d="M91 66 Q100 70 102 78" stroke="#082A59" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="hex" viewBox="0 0 100 100">
          <polygon points="50,2 92,26 92,74 50,98 8,74 8,26" fill="none" stroke="#082A59" strokeWidth="6" />
          <polygon points="50,22 75,36 75,64 50,78 25,64 25,36" fill="#082A59" />
        </symbol>
      </defs>
    </svg>
  );
}

export type Pose = 'menyapa' | 'jempol' | 'hp' | 'checklist' | 'berpikir' | 'menjelaskan' | 'periksa' | 'semangat';

/** Maskot resmi BB GOLD (pose dari folder "Maskot BB GOLD - Pose Individual"). */
export function Bibi({ pose = 'menjelaskan', className = 'h-28 w-28', tunda = 0 }: { pose?: Pose; className?: string; tunda?: number }) {
  return (
    <div className={`relative grid shrink-0 place-items-end justify-center ${className}`} aria-hidden="true">
      <span className="absolute inset-x-[8%] bottom-[4%] top-[18%] rounded-full bg-krem/95 shadow-[0_8px_20px_rgba(0,0,0,.18)]" />
      <img src={`/maskot/${pose}.webp`} alt="" className="maskot melayang relative h-full w-auto object-contain" style={{ animationDelay: `${tunda}s` }} draggable={false} />
    </div>
  );
}

/** Maskot dengan gelembung bicara. */
export function BibiBicara({ judul, children, pose = 'menjelaskan', besar = false, judulTag = 'p' }: { judul: string; children?: React.ReactNode; pose?: Pose; besar?: boolean; judulTag?: 'p' | 'h1' | 'h2' }) {
  const J = judulTag;
  return (
    <div className={`grid items-end gap-1.5 ${besar ? 'grid-cols-[112px_1fr]' : 'grid-cols-[84px_1fr]'}`}>
      <Bibi pose={pose} className={besar ? 'h-28 w-28' : 'h-[84px] w-[84px]'} />
      <div className="gelembung mb-4">
        <J className="m-0 text-base font-bold leading-snug">{judul}</J>
        {children && <div className="mt-0.5 text-[13px] leading-snug text-abu-biru">{children}</div>}
      </div>
    </div>
  );
}
