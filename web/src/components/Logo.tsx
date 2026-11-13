/**
 * Logo sel sarang lebah "B & B" (versi latar biru). GANTI dengan SVG resmi dari
 * Panduan-Merek-BB-GOLD.zip bila tersedia: simpan sebagai public/icons/logo.svg.
 */
export function LogoSel({ className = 'h-10 w-10' }: { className?: string }) {
  const hex = (cx: number, cy: number, r: number) => {
    const p = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
    });
    return p.join(' ');
  };
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Logo BB GOLD">
      <polygon points={hex(50, 27, 24)} fill="#F6DC7A" />
      <polygon points={hex(29, 64, 24)} fill="#FBF7EC" />
      <polygon points={hex(71, 64, 24)} fill="#E5B527" />
      <text x="50" y="35" textAnchor="middle" fontFamily="Poppins" fontWeight="700" fontSize="24" fill="#082A59">&amp;</text>
      <text x="29" y="73" textAnchor="middle" fontFamily="Poppins" fontWeight="700" fontSize="26" fill="#082A59">B</text>
      <text x="71" y="73" textAnchor="middle" fontFamily="Poppins" fontWeight="700" fontSize="26" fill="#082A59">B</text>
    </svg>
  );
}
