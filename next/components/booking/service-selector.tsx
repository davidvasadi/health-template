"use client";

import React from "react";

const ACCENT = "var(--accent, #0ea5a6)";
const ACCENT_600 = "var(--accent-600, #0d9488)";
const BORDER = "#E5E7EB";
const TEXT = "#0B1220";
const MUTED = "#667085";

type Props = {
  selectedService: string;
  onSelectService: (id: string) => void;
  onNext: () => void;
};

export function ServiceSelector({ selectedService, onSelectService, onNext }: Props) {
  const services = [
    { id: "basic", name: "Alap kezelés", duration: "30 perc", price: "12 000 Ft", desc: "Alap panaszokra." },
    { id: "comprehensive", name: "Átfogó kezelés", duration: "45 perc", price: "18 000 Ft", desc: "Komplex panaszokra.", recommended: true },
    { id: "premium", name: "Prémium kezelés", duration: "60 perc", price: "24 000 Ft", desc: "Bővített kezelés + tanácsadás." },
  ];

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2" style={{ color: TEXT }}>Válasszon szolgáltatást</h2>
      <p className="text-sm mb-6" style={{ color: MUTED }}>Válassza ki az igényeinek megfelelőt.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((s) => {
          const active = selectedService === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectService(s.id)}
              aria-pressed={active}
              className={`group rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 ${active ? "shadow" : "hover:shadow"}`}
              style={{ borderColor: active ? (ACCENT as any) : BORDER, background: active ? "rgba(14,165,166,0.06)" : "#fff" }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium" style={{ color: TEXT }}>{s.name}</h3>
                  {s.recommended && (
                    <span className="px-2 py-0.5 text-xs text-white rounded-full" style={{ background: ACCENT_600 as any }}>
                      Ajánlott
                    </span>
                  )}
                </div>
                <p className="text-sm mt-1" style={{ color: MUTED }}>{s.desc}</p>
                <div className="mt-auto pt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">{s.duration}</span>
                  <span className="font-semibold" style={{ color: TEXT }}>{s.price}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={!selectedService}
          className="px-5 py-3 rounded-lg font-medium text-white disabled:opacity-50"
          style={{ background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT_600} 100%)` }}
        >
          Tovább
        </button>
      </div>
    </section>
  );
}
