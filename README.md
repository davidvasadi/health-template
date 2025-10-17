# Health Template – Hivatalos csontkovács (chiropractor) weboldal  
**Tulajdonos:** [davelopment]®

![Health Template](./HealthTemp.png)

A **health-template** egy készre csiszolt, többnyelvű (HU/DE/EN) marketing-weboldal stack **Strapi** (CMS) + **Next.js** frontend párossal.  
Cél: azonnal bevethető, SEO-barát, lokalizált webhely csontkovács/rendelő számára – stabil 404-gyel, automatikus `sitemap.xml`-lel és `robots.txt`-tel, **dinamikus bloggal** és **egyedi komponens-alapú front-enddel**.

---

## ✨ Fő jellemzők

- **Strapi + Next.js** integráció (API-alapú tartalomszolgáltatás)  
- **Többnyelvűség**: magyar (alapértelmezett), német, angol  
- **Lokalizált slug-kezelés** (pl. `hu/szolgaltatasok`, `de/leistungen`, `en/products`)  
- **Stabil 404 (notFound)** – nincs több „üres header/footer”  
- **Automatikus `sitemap.xml` + `robots.txt`** (Strapi tartalom alapján)  
- **Redirection támogatás** (Strapi `redirections` → Next redirectek)  
- **SEO meta / Open Graph** a Strapi-ból  
- **PM2-barát deploy** (Nginx proxyval is jól működik)  
- **Dinamikus blog rendszer** (cikkek, lokalizáció, SEO, képek)  
- **Egyedi, komponens-alapú front-end** (Strapi blokkok → Next komponensek)

---

## 📁 Monorepo felépítés

```
/health-template
  ├─ /strapi         # Strapi CMS (v5) – tartalom, típusok, REST API
  └─ /next           # Next.js 14 – frontend (app router)
       └─ /app
          ├─ [locale]/(marketing)/[slug]/page.tsx   # dinamikus oldalak (lokalizált slug)
          ├─ [locale]/products/page.tsx             # termék/szolgáltatás lista (lokalizált alap-slug)
          ├─ [locale]/blog/page.tsx                 # blog lista (lokalizált útvonal)
          ├─ [locale]/blog/[slug]/page.tsx          # blog cikk (lokalizált cikk-slug)
          ├─ sitemap.xml/route.ts                   # EGYETLEN, XML alapú sitemap generátor
          ├─ robots.ts                              # robots.txt (Sitemap → /sitemap.xml)
          └─ not-found.tsx                          # testreszabott 404 oldal
```

> **Fontos:** a sitemapot kizárólag az **`app/sitemap.xml/route.ts`** szolgálja ki.  
> Ne legyen semmilyen `app/**/sitemap.ts` metadata-fájl, mert felülírja az XML route-ot.

---

## 📰 Dinamikus blog – tartalomszerkesztéstől a publikálásig

### Strapi oldalon
- **Tartalomtípus**: `articles` (cikkek) – lokalizáció támogatással (HU/DE/EN).  
- **Mezők, tipikusak**: `title`, `slug`, `excerpt/description`, `content` (rich text/dinamikus zóna), `coverImage`, `seo` (title/description/OG), `publishedAt`.  
- **Lokalizáció (i18n)**: minden cikkhez létrehozható nyelvi változat; a slug nyelvspecifikus.  
- **Publikálás**: csak a **Published** (live) rekordok kerülnek a sitemapba és a nyilvános listába.  
- **Ütemezés**: `publishedAt` jövőbeli dátummal időzíthető a megjelenés.  
- **Média**: képek, galériák, illusztrációk a Media Library-ből (alt/caption ajánlott SEO miatt).

### Next oldalon
- **Lista oldal**: `/[locale]/blog` – a Strapi-ból listázza az adott nyelvű cikkeket (opcionálisan lapozás).  
- **Cikk oldal**: `/[locale]/blog/[slug]` – Strapi slug alapján hozza a cikket.  
- **SEO**: `generateMetadata` a Strapi `seo` mezőiből.  
- **Hibakezelés**: hibás slug → **notFound()** → `app/not-found.tsx`.  
- **Sitemap**: minden `Published` cikk felkerül, hreflang alternates-szel.  
- **Rich content / blokkok**: Strapi blokkmezők (dinamikus zónák) komponensekre vannak mappelve a Next-ben (pl. hero, kép + szöveg, idézet, FAQ, CTA, stb.), így **egyedi oldalszakaszok** állíthatók össze kódi módosítás nélkül is.

> Tipp: belső linkeket (más cikkekre/oldalakra) Strapi-ban URL-ként add meg; a front-end a lokalizált útvonalra fogja mutatni a megfelelő nyelv alatt.

---

## 🎨 Egyedi front-end – komponens architektúra

- **Blokkrenderelő**: a Strapi-ból érkező „blokkokat” a Next **komponenskönyvtára** rendereli. Új blokk = új komponens + mappelés.  
- **Oldalszintű komponens**: `PageContent` – a teljes oldalstruktúrát építi fel a Strapi adatokból.  
- **Lokalizált navigáció**: `ClientSlugHandler` gondoskodik arról, hogy az URL-ek a megfelelő nyelvi slugokra mutassanak.  
- **Reszponzív** layout: mobil-first, grid/flex alapú elrendezések.  
- **SEO-first**: helyes heading hierarchia, meta-k a Strapi-ból, képekhez alt.  
- **Könnyen skinezhető**: a komponensek stílusa egységes, változtatható (utility-first vagy moduláris CSS – a projektben beállított megoldás szerint).

---

## 🧩 Követelmények

- **Node.js 20+** (ajánlott)  
- **npm**  
- Futáshoz két processz: **Strapi** (1337) és **Next** (3000 / reverse proxy mögött)

---

## 🚀 Gyors indítás (lokálisan)

### 1) Környezeti változók

**Strapi** (másold és állítsd be):
```bash
cp ./strapi/.env.example ./strapi/.env
# Szükség szerint módosítsd a .env-et (adatbázis, port stb.)
```

**Next**:
```bash
cp ./next/.env.example ./next/.env
```

Példa Next `.env` (dev):
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
WEBSITE_URL=http://localhost:3000

STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337
```

### 2) Strapi indítása (dev)
```bash
cd strapi
npm i
npm run develop
```

### 3) Next indítása (dev)
Új terminálban:
```bash
cd next
npm i
npm run dev
```

- Frontend: `http://localhost:3000`  
- Strapi admin: `http://localhost:1337/admin`

---

## 🏗️ Build & Deploy (PM2)

> Ha csak a **Next** kód változott (pl. sitemap/404/slug), **nem szükséges** a Strapihoz nyúlni.

**Első indítás PM2-vel:**
```bash
# STRAPI (ha kell)
cd strapi
npm ci
NODE_ENV=production npm run build
pm2 start npm --name strapi -- start

# NEXT
cd ../next
npm ci
npm run build
pm2 start npm --name next -- start

pm2 save
```

**Következő frissítések (NEXT-only tipikus):**
```bash
cd next
npm ci
npm run build
pm2 restart next
pm2 logs next --lines 100
```

**Prod .env Next-hez (példa):**
```
NODE_ENV=production
WEBSITE_URL=https://csontkovacsbence.hu
NEXT_PUBLIC_SITE_URL=https://csontkovacsbence.hu

STRAPI_URL=http://127.0.0.1:1337
NEXT_PUBLIC_STRAPI_URL=http://127.0.0.1:1337
NEXT_PUBLIC_STRAPI_API_URL=http://127.0.0.1:1337

# Ha a Strapi API védett:
# STRAPI_TOKEN=PROD_API_TOKEN
```

---

## 🌍 I18n – nyelvek és slugok

- Támogatott nyelvek: **HU (alap)**, DE, EN  
- **Products / Szolgáltatások** index slug:  
  - `hu/szolgaltatasok`  
  - `de/leistungen`  
  - `en/products`  
- A dinamikus oldalaknál a Strapi `localizations` alapján a Next a megfelelő slugot tölti be, és **404-et dob** ha nincs találat → ez javítja a korábbi „üres oldal” hibát.
- A blognál is minden cikkhez külön nyelvi slug tartozik; a `hreflang` kapcsolatok a sitemapban jelennek meg.

---

## 🤖 SEO: sitemap & robots

- `app/sitemap.xml/route.ts` gyártja az **XML** sitemapot:
  - Kezdőoldalak (hu/de/en)
  - Statikus indexek (pl. `blog`, `products`/`leistungen`/`szolgaltatasok`)
  - Strapi-ból: **pages**, **articles**, **products**
  - Hreflang alternates (`xhtml:link`)
  - Cache: `s-maxage=600` (kb. 10 perc)

- `app/robots.ts`:
  ```txt
  User-Agent: *
  Allow: /
  Disallow: /admin
  Disallow: /api
  Disallow: /_next
  Disallow: /next
  Disallow: /private

  Host: https://csontkovacsbence.hu
  Sitemap: https://csontkovacsbence.hu/sitemap.xml
  ```

> **Tipp:** prodon **csak a „Published”** Strapi rekordok kerülnek be a sitemapba.  
> Ha kevés az URL, publikáld a `pages/articles/products` elemeket.

---

## 🔁 Redirectek

A `next.config.mjs` képes a Strapi `redirections` végpontjáról (ha van) átirányításokat beolvasni.  
Prodon 200 esetén a `/:locale` prefixel lokalizált redirectek jönnek létre (pl. `/hu/...` → `/hu/...`).

---

## 🧪 Smoke teszt (éles/locál prod)

1. `…/robots.txt` → benne a `Sitemap: …/sitemap.xml`  
2. `…/sitemap.xml` → **XML `<urlset>`**, több `<url><loc>…</loc></url>`  
3. `…/hu/valami-nem-letezik` → **saját 404** oldal  
4. `…/hu/szolgaltatasok`, `…/de/leistungen`, `…/en/products` → mind töltsön be  
5. `…/hu/blog` + tetszőleges cikk → betölt, SEO meta rendben

---

## ❗ Hibakeresés (gyors)

- **PM2 logok**:
  ```bash
  pm2 logs next --lines 100
  pm2 logs strapi --lines 100
  ```
- **Sitemap forrás fejléce** (ha bekapcsoltad a jelzőt):
  ```bash
  curl -I https://csontkovacsbence.hu/sitemap.xml | grep -i x-sitemap-source
  ```
- **Duplikált URL ellenőrzés**:
  ```bash
  curl -s https://csontkovacsbence.hu/sitemap.xml     | grep -o '<loc>[^<]*</loc>'     | sed 's#</*loc>##g'     | sort | uniq -d
  ```

---

## 🗺️ Útiterv / TODO

- [ ] Search Console bekötése, `sitemap.xml` beküldése  
- [ ] (Opcionális) Strapi SEO plugin  
- [ ] (Opcionális) Preview plugin  
- [ ] Lokalizált tartalmak bővítése (árak, szolgáltatások, cikkek)  
- [ ] Creator/author meta mezők kiegészítése

---

## © Tulajdon & licenc

Az egész projekt és a benne található minden egyedi fejlesztés **[davelopment]®** tulajdona.  
A Strapi és a Next.js nyílt forrású technológiák; használatuk a saját licencük szerint történik.

> © [davelopment]® – minden jog fenntartva.
