// components/legal/legal-page.tsx
import React from "react";
import { BlocksRenderer } from "./block-renderer"; // ha máshol van, igazítsd az importot

function lastUpdatedLabel(locale: string) {
  const l = (locale || "").toLowerCase();
  if (l.startsWith("hu")) return "Utolsó frissítés";
  if (l.startsWith("de")) return "Zuletzt aktualisiert";
  // további nyelveket ide vehetsz fel
  return "Last updated";
}

function formatLegalDate(value?: string | null, locale: string = "en") {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    // yyyy.MM.dd vagy locale szerinti formátum – itt locale szerint formázunk
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return null;
  }
}

export function LegalPage({
  title,
  lastUpdated,
  content,
  locale,
}: {
  title?: string;
  lastUpdated?: string | null;
  content: any;
  locale: string; // KELL a lokalizált label és dátum miatt
}) {
  const formatted = formatLegalDate(lastUpdated, locale);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 mt-16">
        {title && <h1 className="text-3xl font-bold text-breaker-bay-950">{title}</h1>}

        {formatted && (
          <p className="mt-2 text-sm text-neutral-600">
            {lastUpdatedLabel(locale)}: {formatted}
          </p>
        )}

        <div className="mt-8">
          <BlocksRenderer content={content} />
        </div>
      </div>
    </section>
  );
}
