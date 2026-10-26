// Visuel du hero : silhouette en tranches + ruban orbital. Remplaçable par une vraie image détourée (PNG) dans /public.
export function HeroVisual() {
  const bars = Array.from({ length: 13 }, (_, i) => {
    const x = 306 + i * 13;
    const d = (x - 300) / 150;
    const h = 125 * Math.sqrt(Math.max(0, 1 - d * d));
    return { x, w: 9 - i * 0.5, y: 210 - h, h: h * 2, o: 1 - i * 0.04 };
  });
  const ribbon = "Postulez  •  Recrutez  •  Convoquez  •  Embauchez  •  Postulez  •  Recrutez  •  Convoquez  •  ";
  return (
    <svg viewBox="0 0 600 640" className="h-full w-full overflow-visible" role="img" aria-label="Illustration : un profil candidat entouré d'un ruban orange">
      <defs>
        <linearGradient id="body" gradientUnits="userSpaceOnUse" x1="190" y1="80" x2="430" y2="620">
          <stop offset="0" stopColor="#4d93b0" />
          <stop offset=".3" stopColor="#16264a" />
          <stop offset="1" stopColor="#0a1020" />
        </linearGradient>
        <linearGradient id="og" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff8a3d" />
          <stop offset="1" stopColor="#ff4e00" />
        </linearGradient>
        <radialGradient id="halo"><stop offset="0" stopColor="#ff7a2e" stopOpacity=".55" /><stop offset="1" stopColor="#ff7a2e" stopOpacity="0" /></radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="14" /></filter>
        <path id="arc" d="M10 470 A290 62 0 0 0 590 470" />
      </defs>

      <circle cx="300" cy="300" r="270" fill="url(#halo)" />
      <g transform="rotate(-14 300 470)">
        <ellipse cx="300" cy="470" rx="290" ry="62" fill="none" stroke="url(#og)" strokeWidth="30" opacity=".85" />
      </g>

      <g fill="url(#body)">
        <path d="M110 640C122 480 215 405 300 392 385 405 478 480 490 640Z" />
        <rect x="252" y="300" width="96" height="100" />
        <path d="M300 85C236 85 195 140 195 210s41 125 105 125V85Z" />
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.w / 2} opacity={b.o} />
        ))}
      </g>

      <rect x="190" y="198" width="222" height="46" rx="23" fill="#ff5a0f" filter="url(#blur)" opacity=".75" />
      <rect x="190" y="198" width="222" height="46" rx="23" fill="url(#og)" />
      <text x="301" y="226" textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="4" fill="#7a2300" opacity=".85">WORKMATCH</text>

      <g transform="rotate(-14 300 470)">
        <use href="#arc" fill="none" stroke="url(#og)" strokeWidth="30" />
        <text fill="#fff" fontSize="14" fontWeight="700" letterSpacing="3" dy="5">
          <textPath href="#arc" startOffset="2%">{ribbon}</textPath>
        </text>
      </g>
    </svg>
  );
}
