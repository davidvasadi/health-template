// Navbar link: belső útvonal elé locale prefix, külső (http, mailto, tel…) változatlanul
function isExternalUrl(u: string) {
  const s = u.toLowerCase();
  return (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("//") ||
    s.startsWith("mailto:") ||
    s.startsWith("tel:") ||
    s.startsWith("sms:")
  );
}

export function navHref(locale: string, url?: string | null) {
  const u = (url ?? "").trim();
  return isExternalUrl(u) ? u : `/${locale}${u}`;
}
