// URL publique du logo d'une entreprise. Le fichier est servi par /logo/[slug] ;
// le paramètre ?v= change à chaque nouveau logo pour contourner le cache du navigateur.
export function logoSrc(slug: string, pathname: string | null) {
  if (!pathname) return null;
  const v = pathname.split("/").pop() ?? "";
  return `/logo/${slug}?v=${encodeURIComponent(v)}`;
}
