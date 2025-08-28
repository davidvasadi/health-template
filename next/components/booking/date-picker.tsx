"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ACCENT = "var(--accent, #0ea5a6)";
const ACCENT_600 = "var(--accent-600, #0d9488)";
const BORDER = "#E5E7EB";
const TEXT = "#0B1220";
const MUTED = "#667085";

type Props = {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (v: string) => void;
  selectedTime: string; // HH:mm
  onSelectTime: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

// helpers
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmt = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function getSlotsForDate(dStr: string): string[] {
  if (!dStr) return [];
  const d = new Date(dStr + "T00:00:00");
  const day = d.getDay(); // 0 Sun
  if (day === 0) return []; // vasárnap zárva
  if (day === 6) return ["08:00", "09:30", "11:00", "12:30"]; // szombat
  return ["08:00", "09:30", "11:00", "13:00", "14:30", "16:00", "17:30"];
}

export function DateTimePicker({
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  onPrev,
  onNext,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const y = currentMonth.getFullYear();
  const m = currentMonth.getMonth();
  const monthNames = [
    "Január","Február","Március","Április","Május","Június",
    "Július","Augusztus","Szeptember","Október","November","December"
  ];
  const weekNames = ["H","K","Sze","Cs","P","Szo","V"]; // hétfő az első

  const todayKey = (() => {
    const t = new Date(); t.setHours(0,0,0,0);
    return fmt(t.getFullYear(), t.getMonth(), t.getDate());
  })();

  // 6x7 rács
  const daysGrid = useMemo(() => {
    const first = new Date(y, m, 1);
    let startOffset = first.getDay(); // 0 Sun..6 Sat
    if (startOffset === 0) startOffset = 6; else startOffset -= 1; // Mon=0
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const cells: { key: string; day: number | null; inMonth: boolean }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ key: `b-${i}`, day: null, inMonth: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ key: `d-${d}`, day: d, inMonth: true });
    while (cells.length % 7 !== 0) cells.push({ key: `a-${cells.length}`, day: null, inMonth: false });
    while (cells.length < 42) cells.push({ key: `a2-${cells.length}`, day: null, inMonth: false });
    return cells;
  }, [y, m]);

  const isPast = (dKey: string) => new Date(dKey) < new Date(todayKey);

  // időszűrő
  type Period = "all" | "am" | "pm" | "eve";
  const [period, setPeriod] = useState<Period>("all");
  const allSlots = useMemo(() => getSlotsForDate(selectedDate), [selectedDate]);
  const filteredSlots = useMemo(() => {
    if (period === "all") return allSlots;
    return allSlots.filter((t) => {
      const [hh, mm] = t.split(":").map(Number);
      const mins = hh * 60 + mm;
      if (period === "am") return mins < 12 * 60;
      if (period === "pm") return mins >= 12 * 60 && mins < 17 * 60;
      return mins >= 17 * 60; // eve
    });
  }, [allSlots, period]);

  const canNext = !!selectedDate && !!selectedTime;

  // gyors választók
  const jumpToday = () => {
    const t = new Date(); const d = fmt(t.getFullYear(), t.getMonth(), t.getDate());
    setCurrentMonth(new Date(t.getFullYear(), t.getMonth(), 1));
    onSelectDate(d); onSelectTime("");
  };
  const jumpTomorrow = () => {
    const t = new Date(); t.setDate(t.getDate() + 1);
    const d = fmt(t.getFullYear(), t.getMonth(), t.getDate());
    setCurrentMonth(new Date(t.getFullYear(), t.getMonth(), 1));
    onSelectDate(d); onSelectTime("");
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2" style={{ color: TEXT }}>Válasszon dátumot és időpontot</h2>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Mobilon kompakt rács, asztali nézetben nagyobb tappolható felületek.
      </p>

      <div className="relative rounded-2xl border p-4 sm:p-5 bg-white overflow-hidden" style={{ borderColor: BORDER }}>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "12px 12px" }}
        />

        {/* Fejléc + navigáció + gyors választók */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(y, m - 1, 1))}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Előző hónap"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-base md:text-lg font-medium" style={{ color: TEXT }}>
              {monthNames[m]} {y}
            </div>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(y, m + 1, 1))}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Következő hónap"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={jumpToday}
              className="h-9 px-3 rounded-lg border text-sm"
              style={{ borderColor: BORDER, color: TEXT }}
            >
              Ma
            </button>
            <button
              type="button"
              onClick={jumpTomorrow}
              className="h-9 px-3 rounded-lg border text-sm"
              style={{ borderColor: BORDER, color: TEXT }}
            >
              Holnap
            </button>
          </div>
        </div>

        {/* Fejlécek */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekNames.map((w) => (
            <div key={w} className="h-7 flex items-center justify-center text-[11px] md:text-xs font-medium text-gray-500">
              {w}
            </div>
          ))}
        </div>

        {/* Naptár rács */}
        <div className="grid grid-cols-7 gap-1">
          {daysGrid.map(({ key, day, inMonth }) => {
            const dKey = day ? fmt(y, m, day) : "";
            const weekend = day ? [0, 6].includes(new Date(y, m, day).getDay()) : false;
            const disabled = !day || !inMonth || isPast(dKey) || weekend;
            const selected = dKey === selectedDate;
            const isToday = dKey === todayKey;

            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (!disabled) { onSelectDate(dKey); onSelectTime(""); }
                }}
                className={`h-9 w-9 md:h-11 md:w-11 rounded-full mx-auto flex items-center justify-center text-[13px] md:text-sm font-medium
                  ${disabled ? "text-gray-300" : selected ? "text-white" : "text-gray-700"}
                  ${disabled ? "" : selected ? "" : "hover:bg-gray-100"}
                `}
                style={{
                  background: selected ? ACCENT : "transparent",
                  border: isToday && !selected ? `1px solid ${ACCENT_600}` : "1px solid transparent",
                }}
                aria-pressed={selected}
                aria-label={day ? `${y}.${m + 1}.${day}.` : "üres"}
              >
                {day ?? ""}
              </button>
            );
          })}
        </div>

        {/* Időpont-szűrő + legenda (desktopon látható) */}
        <div className="mt-5 flex items-center justify-between">
          <div className="text-sm font-medium" style={{ color: TEXT }}>Időpont</div>
          <div className="hidden md:flex items-center gap-3 text-xs" style={{ color: MUTED }}>
            <span className="inline-flex items-center gap-1">
              <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: ACCENT }} />
              Szabad
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="inline-block h-2.5 w-2.5 rounded-full bg-gray-300" />
              Foglalt
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="inline-block h-2.5 w-2.5 rounded-full bg-gray-200" />
              Zárva
            </span>
          </div>
          <div className="inline-flex rounded-lg border p-1" role="tablist" style={{ borderColor: BORDER, background: "#F8FAFC" }}>
            {(["all", "am", "pm", "eve"] as const).map((k) => {
              const active = k === period;
              return (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    const el = document.activeElement as HTMLElement | null;
                    el?.blur();
                    setPeriod(k);
                  }}
                  className="px-3 h-9 text-sm rounded-md"
                  style={{ background: active ? ACCENT : "transparent", color: active ? "#fff" : TEXT }}
                >
                  {k === "all" ? "Mind" : k === "am" ? "Reggel" : k === "pm" ? "Délután" : "Este"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Időpont rács */}
        <div
          className="mt-2 grid gap-2"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))" }}
          role="grid"
        >
          {selectedDate ? (
            filteredSlots.length ? (
              filteredSlots.map((t) => {
                const active = t === selectedTime;
                const demoBusy = t.endsWith(":30") || t === "11:00";
                const disabled = demoBusy;
                return (
                  <button
                    key={t}
                    type="button"
                    role="gridcell"
                    aria-selected={active}
                    disabled={disabled}
                    onClick={() => !disabled && onSelectTime(t)}
                    className={`h-11 md:h-12 rounded-xl border text-sm font-medium transition
                      ${active ? "shadow" : "hover:shadow"}
                      ${disabled ? "opacity-40 cursor-not-allowed" : ""}
                    `}
                    style={{
                      borderColor: BORDER,
                      background: active ? ACCENT : "#fff",
                      color: active ? "#fff" : TEXT,
                    }}
                    title={t}
                  >
                    {t}
                  </button>
                );
              })
            ) : (
              <div className="col-span-full text-sm" style={{ color: MUTED }}>
                Ezen a napon nincs elérhető időpont a szűrő szerint.
              </div>
            )
          ) : (
            <div className="col-span-full text-sm" style={{ color: MUTED }}>
              Válasszon előbb egy napot.
            </div>
          )}
        </div>

        {/* Navigáció */}
        <div className="mt-6 flex items-center justify-between">
          <button type="button" onClick={onPrev} className="px-4 h-11 rounded-lg border" style={{ borderColor: BORDER, color: TEXT }}>
            Vissza
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className="px-5 h-11 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT_600} 100%)` }}
          >
            Tovább
          </button>
        </div>
      </div>
    </section>
  );
}
