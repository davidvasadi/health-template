### Mit csinál?

- Bevezet egy **egyetlen, egyben futó CI/CD pipeline-t** `ship-it.yml` néven, ami:
  - `changes` jobbal (paths-filter) detektálja, hogy **Next** (`next/**`) és/vagy **Strapi** (`strapi/**`) változott-e.
  - Ha **Next változott**, lefuttatja a `next-build` jobot (`npm ci` + `npm run build` a `next/` mappában).
  - Ha **Strapi változott**, lefuttatja a `strapi-build` jobot (`npm ci` + `npm run build` a `strapi/` mappában).
  - Ezután a `deploy` job **csak akkor indul**, ha:
    - push történt a `main` ágra (nem PR),
    - volt érdemi változás `next/**` vagy `strapi/**` alatt,
    - és minden szükséges build job **SUCCESS**.
- A deploy a VPS-en **staging worktree build** stratégiát használ:
  - build külön `.deploy/build-$SHA` worktree-ben,
  - gyorsítás: ha a lockfile nem változott, a live `node_modules` symlinkelhető,
  - csak sikeres build után állítja le a PM2 procikat (minimális downtime),
  - élesítés előtt **biztonsági mentés** készül (PM2 state + Strapi sqlite DB backup + nginx config mentés),
  - deploy végén **smoke test** fut (`/hu` és `/api/global`), hiba esetén **rollback** történik.
- A GitHub Actions UI-ban így **egy helyen látszik a teljes folyamat**: `changes → (next/strapi build) → deploy`.

### Miért kellett?

Korábban a Build és a Deploy külön workflowként futott, emiatt előfordulhatott, hogy:

- a deploy **akkor is elindult**, ha a build hibás / elhasalt,
- a folyamat **szét volt szórva több workflow run-ra**, nehezebb volt követni és debugolni,
- gyakori pusholásnál nőtt a hibalehetőség és az átláthatatlanság.

A cél: **egy determinisztikus pipeline**, ami *csak sikeres build után deployol*, és egy helyen követhető.

### Hogyan teszteld?

1) **Next-only változtatás push** (`next/**`):
   - elvárt: `changes` → `next-build` lefut, `strapi-build` skip, majd `deploy` lefut.
2) **Strapi-only változtatás push** (`strapi/**`):
   - elvárt: `changes` → `strapi-build` lefut, `next-build` skip, majd `deploy` lefut.
3) **Szándékos build hiba** (pl. Next build törés):
   - elvárt: `next-build` fail → `deploy` **NEM** indul el.
4) Sikeres deploy után gyors ellenőrzés:
   - `https://theplacestudio.hu/hu` betölt (200–3xx)
   - `https://theplacestudio.hu/api/global` válaszol (200–3xx)
   - PM2 processzek futnak (`pm2 status`), Strapi/Next nem állt le.

További ellenőrzések:

- [ ] Strapi project uuid: `"LAUNCHPAD"` (`strapi/packages.json`).
- [ ] Strapi verzió a lehető legfrissebb.
- [ ] Ha Strapi verzió változott, a `strapi/scripts/prefillLoginFields.js` működik.
- [ ] Ha tartalom frissült, készült új export a `strapi/data` mappába, és ha kell, frissült a seed command a `strapi/packages.json`-ben.

### Kapcsolódó issue(k)/PR(ek)

- N/A (infrastruktúra / CI-CD fejlesztés)
- Motiváció: build+deploy szétcsúszás megszüntetése, “deploy ne fusson hibás buildre”.


---

## English version (below)

### What does it do?

- Introduces a **single, end-to-end CI/CD pipeline** called `ship-it.yml` that:
  - Uses a `changes` job (paths-filter) to detect whether **Next** (`next/**`) and/or **Strapi** (`strapi/**`) changed.
  - If **Next changed**, runs `next-build` (`npm ci` + `npm run build` in `next/`).
  - If **Strapi changed**, runs `strapi-build` (`npm ci` + `npm run build` in `strapi/`).
  - Then runs `deploy` **only if**:
    - it’s a push to `main` (not a PR),
    - there were changes under `next/**` or `strapi/**`,
    - and all required build jobs are **SUCCESS**.
- The VPS deploy uses a **staging worktree build** strategy:
  - builds in a separate `.deploy/build-$SHA` worktree,
  - optional speed-up: if lockfile didn’t change, it can symlink live `node_modules`,
  - stops PM2 processes only after a successful build (minimal downtime),
  - creates **backups** before switching live code (PM2 state + Strapi sqlite DB + nginx config),
  - runs **smoke tests** (`/hu` and `/api/global`) and performs **rollback** on failure.
- In GitHub Actions UI the whole flow is visible in **one run**: `changes → (next/strapi build) → deploy`.

### Why is it needed?

Previously Build and Deploy were separate workflows, which could lead to:

- deploy starting even if the build failed,
- the process being split across multiple workflow runs (harder to follow/debug),
- increased risk/overhead with frequent pushes.

Goal: **one deterministic pipeline** that deploys *only after successful builds*, and is easy to track.

### How to test it?

1) **Push a Next-only change** (`next/**`):
   - expected: `changes` → `next-build` runs, `strapi-build` skipped, then `deploy` runs.
2) **Push a Strapi-only change** (`strapi/**`):
   - expected: `changes` → `strapi-build` runs, `next-build` skipped, then `deploy` runs.
3) **Introduce a build failure** (e.g. break Next build):
   - expected: `next-build` fails → `deploy` does **NOT** run.
4) After a successful deploy, quick checks:
   - `https://theplacestudio.hu/hu` returns 200–3xx
   - `https://theplacestudio.hu/api/global` returns 200–3xx
   - PM2 processes are up (`pm2 status`), Strapi/Next are healthy.

Some additional things to check:

- [ ] Strapi project uuid is "LAUNCHPAD". `strapi/packages.json`.
- [ ] Strapi version is the latest possible.
- [ ] If the Strapi version has been changed, make sure that the `strapi/scripts/prefillLoginFields.js` works.
- [ ] If you updated content, make sure to create a new export in the `strapi/data` folder and update the `strapi/packages.json` seed command if necessary.

### Related issue(s)/PR(s)

- N/A (infrastructure / CI-CD improvement)
- Motivation: prevent deploy on broken builds, unify build+deploy visibility.
