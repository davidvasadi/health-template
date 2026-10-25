// Kis breadcrumb a navbar alatt a menüből elérhető fő aloldalakon (Szolgáltatások, Csapat, Árak…).
// A felirat SEO-szöveg (SEO_LABEL), vagy ha nincs, a navbar menüpont szövege; ha az oldal nincs a menüben, nincs breadcrumb.
// Általában csak navigáció (az oldal H1-ét a saját címe adja); `asH1`-gyel az utolsó elem a H1 (pl. Szolgáltatások).
// A BreadcrumbList strukturált adatot is ez adja – az oldal a Strapi-s BreadcrumbList-et ilyenkor kiszűri.
// Abszolút pozícióban van, nem tolja el a tartalmat.
import Link from "next/link";
import { Container } from "@/components/container";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { breadcrumbJsonLd } from "@/lib/shared/structured-data";

const HOME_LABEL: Record<string, string> = { hu: "Főoldal", en: "Home", de: "Startseite" };

// SEO-felirat a breadcrumb utolsó elemére ("locale/slug")
const SEO_LABEL: Record<string, string> = {
  "hu/szolgaltatasok": "Csontkovács kezelés Budapesten",
  "hu/csapat": "Csontkovácsaink Budapesten",
  "hu/arak": "Csontkovács árak",
  "hu/blog": "Csontkovács blog",
  "hu/kapcsolat": "Kapcsolat és időpontfoglalás",
  "hu/otthoni-torna-gyakorlatok": "Otthoni torna gyakorlatok",
  "en/products": "Chiropractic Treatment in Budapest",
  "en/team": "Our Chiropractors in Budapest",
  "en/pricing": "Chiropractic Prices",
  "en/blog": "Chiropractic Blog",
  "en/contact-us": "Contact & Booking",
  "de/leistungen": "Chiropraktik in Budapest",
  "de/team": "Unsere Chiropraktiker in Budapest",
  "de/preise": "Chiropraktik Preise",
  "de/blog": "Chiropraktik Blog",
  "de/kontakt": "Kontakt & Terminbuchung",
  "de/faq": "Häufige Fragen zur Chiropraktik",
};

type NavItem = { URL?: string; text?: string };
export type Crumb = { locale: string; slug: string; label: string; homeLabel: string };

async function getNavLabel(locale: string, slug: string) {
  const global = await fetchContentType(
    "global",
    { locale, populate: { navbar: { populate: { left_navbar_items: true } } } },
    true,
    { silent: true }
  );
  const items: NavItem[] = global?.navbar?.left_navbar_items ?? [];
  return items.find((i) => (i?.URL ?? "").replace(/\/$/, "") === `/${slug}`)?.text ?? null;
}

// Van-e breadcrumb az oldalon (és mi a felirata) – az oldal ez alapján szűri a Strapi-s BreadcrumbList-et
export async function resolveBreadcrumb(
  locale: string,
  section: string,
  // ha a menüben nincs ilyen útvonal (pl. a de menü a /products-ra mutat), ez a felirat
  fallbackLabel?: string | null
): Promise<Crumb | null> {
  const slug = (section ?? "").replace(/^\/|\/$/g, "");
  if (!slug) return null;
  const navLabel = (await getNavLabel(locale, slug)) ?? (fallbackLabel?.trim() || null);
  if (!navLabel) return null;
  return {
    locale,
    slug,
    label: SEO_LABEL[`${locale}/${slug}`] ?? navLabel,
    homeLabel: HOME_LABEL[locale] ?? HOME_LABEL.hu,
  };
}

export function Breadcrumb({ crumb, asH1 = false }: { crumb: Crumb | null; asH1?: boolean }) {
  if (!crumb) return null;
  const { locale, slug, label, homeLabel } = crumb;

  return (
    <div className="absolute inset-x-0 top-24 z-40 pointer-events-none">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(locale, homeLabel, label, slug)) }}
      />
      <Container>
        <nav aria-label="Breadcrumb" className="text-xs md:text-sm text-neutral-500">
          <ol className="flex items-center gap-1.5 pointer-events-auto w-fit">
            <li>
              <Link href={`/${locale}`} className="hover:text-breaker-bay-900 transition-colors">
                {homeLabel}
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-neutral-700">
              {asH1 ? <h1 className="text-xs md:text-sm font-normal">{label}</h1> : label}
            </li>
          </ol>
        </nav>
      </Container>
    </div>
  );
}
