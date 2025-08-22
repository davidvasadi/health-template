"use client";

import React, { useState } from "react";
import { CheckCircle2, Pencil } from "lucide-react";
import { ServiceSelector } from "@/components/booking/service-selector";
import { DateTimePicker } from "@/components/booking/date-picker";
import { BookingForm } from "@/components/booking/booking-form";

// Brand vars (globálisan felülírhatók a globals.css-ben)
// :root { --accent: #0ea5a6; --accent-600: #0d9488; --radius: 14px; }
const ACCENT = "var(--accent, #0ea5a6)";
const ACCENT_600 = "var(--accent-600, #0d9488)";
const BORDER = "#E5E7EB";
const TEXT = "#0B1220";
const MUTED = "#667085";

type Step = 1 | 2 | 3 | 4;
type Customer = { name: string; email: string; phone: string; notes: string };

const SERVICE_LABEL: Record<string, string> = {
  basic: "Alap kezelés",
  comprehensive: "Átfogó kezelés",
  premium: "Prémium kezelés",
};
const SERVICE_DURATION_MIN: Record<string, number> = {
  basic: 30,
  comprehensive: 45,
  premium: 60,
};

// ===== .ICS helpers =====
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toICSDate = (dt: Date) =>
  `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(
    dt.getHours()
  )}${pad(dt.getMinutes())}00`;

function parseLocalDateTime(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

function downloadICS(options: {
  title: string;
  start: Date;
  end: Date;
  description?: string;
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@booking.local`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(options.start)}`,
    `DTEND:${toICSDate(options.end)}`,
    `SUMMARY:${options.title}`,
    options.description ? `DESCRIPTION:${options.description.replace(/\n/g, "\\n")}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "foglalas.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AppointmentBooking() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(""); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>(""); // HH:mm
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [bookingComplete, setBookingComplete] = useState(false);

  // Union-safe léptetés
  const STEP_NEXT: Record<Step, Step> = { 1: 2, 2: 3, 3: 4, 4: 4 };
  const STEP_PREV: Record<Step, Step> = { 1: 1, 2: 1, 3: 2, 4: 3 };
  const nextStep = () => setCurrentStep((s) => STEP_NEXT[s]);
  const prevStep = () => setCurrentStep((s) => STEP_PREV[s]);

  const canGoToStep4 =
    !!selectedService && !!selectedDate && !!selectedTime && !!customer.name;

  const handleConfirm = () => {
    setBookingComplete(true);
  };

  const handleICSDownload = () => {
    const duration =
      SERVICE_DURATION_MIN[selectedService] ?? SERVICE_DURATION_MIN.premium;
    const start = parseLocalDateTime(selectedDate, selectedTime);
    const end = new Date(start.getTime() + duration * 60000);
    const summary = `Időpont – ${SERVICE_LABEL[selectedService] || "Kezelés"}`;
    const desc = [
      customer.name ? `Név: ${customer.name}` : "",
      customer.phone ? `Telefon: ${customer.phone}` : "",
      customer.email ? `Email: ${customer.email}` : "",
      customer.notes ? `Megjegyzés: ${customer.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    downloadICS({ title: summary, start, end, description: desc });
  };

  const resetAll = () => {
    setBookingComplete(false);
    setCurrentStep(1);
    setSelectedService("");
    setSelectedDate("");
    setSelectedTime("");
    setCustomer({ name: "", email: "", phone: "", notes: "" });
  };

  // ===== Desktop-összegző (sticky aside) =====
  const Summary = () => (
    <aside className="hidden lg:block lg:col-span-4">
      <div
        className="sticky top-8 rounded-2xl border bg-white shadow-sm overflow-hidden"
        style={{ borderColor: BORDER }}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold" style={{ color: TEXT }}>
            Összegzés
          </h3>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            Foglalással elfogadja az{" "}
            <a
              href="/adatkezelesi-tajekoztato"
              className="underline"
              style={{ color: ACCENT }}
              target="_blank"
              rel="noreferrer"
            >
              adatkezelési tájékoztatót
            </a>
            .
          </p>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Szolgáltatás</dt>
              <dd className="font-medium text-gray-900">
                {SERVICE_LABEL[selectedService] || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Dátum</dt>
              <dd className="font-medium text-gray-900">
                {selectedDate
                  ? new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      "hu-HU",
                      { year: "numeric", month: "long", day: "numeric" }
                    )
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Időpont</dt>
              <dd className="font-medium text-gray-900">
                {selectedTime || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Név</dt>
              <dd className="font-medium text-gray-900">
                {customer.name || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">
                {customer.email || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Telefon</dt>
              <dd className="font-medium text-gray-900">
                {customer.phone || "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Finom alsó info-sáv */}
        <div
          className="px-6 py-4 text-xs"
          style={{
            background:
              "linear-gradient(180deg, rgba(14,165,166,0.06) 0%, rgba(14,165,166,0.02) 100%)",
            color: MUTED,
          }}
        >
          Tipp: az adatok a 4. lépésnél még szerkeszthetők.
        </div>
      </div>
    </aside>
  );

  // ===== Fejléckártya + progress + GDPR note (mindkét nézet) =====
  const HeaderCard = () => (
    <div className="relative overflow-hidden border rounded-2xl bg-white">
      <div
        aria-hidden
        className="absolute -top-24 right-[-10%] h-64 w-64 rounded-full blur-3xl opacity-25"
        style={{
          background: `radial-gradient(closest-side, ${ACCENT} 0%, transparent 70%)`,
        }}
      />
      <div className="relative px-5 sm:px-8 py-6 border-b" style={{ borderColor: BORDER }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: TEXT }}>
              Időpontfoglalás
            </h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              4 lépés • letisztult, gyors folyamat
            </p>
            <p className="text-xs mt-2" style={{ color: MUTED }}>
              Foglalással elfogadja az{" "}
              <a
                href="/adatkezelesi-tajekoztato"
                className="underline"
                style={{ color: ACCENT }}
                target="_blank"
                rel="noreferrer"
              >
                adatkezelési tájékoztatót
              </a>
              .
            </p>
          </div>
          <ol className="hidden md:flex items-center gap-3">
            {[1, 2, 3, 4].map((s) => (
              <li key={s} className="flex flex-col items-center">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium"
                  style={{
                    borderColor: BORDER,
                    background: s <= currentStep ? ACCENT : "#fff",
                    color: s <= currentStep ? "#fff" : TEXT,
                  }}
                >
                  {s}
                </span>
                <span className="text-xs mt-1" style={{ color: s === currentStep ? TEXT : MUTED }}>
                  {s === 1 ? "Szolgáltatás" : s === 2 ? "Dátum/Idő" : s === 3 ? "Adataid" : "Ellenőrzés"}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="w-full bg-gray-100 h-2 mt-4 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${currentStep * 25}%`,
              background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT_600} 100%)`,
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
      <HeaderCard />

      {/* Kétoszlopos desktop elrendezés */}
      <div className="mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Fő tartalom */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border bg-white p-5 sm:p-8 shadow-sm" style={{ borderColor: BORDER }}>
            {currentStep === 1 && (
              <ServiceSelector
                selectedService={selectedService}
                onSelectService={setSelectedService}
                onNext={nextStep}
              />
            )}

            {currentStep === 2 && (
              <DateTimePicker
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setSelectedTime("");
                }}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
                onPrev={prevStep}
                onNext={nextStep}
              />
            )}

            {currentStep === 3 && (
              <BookingForm
                onSubmit={(fd) => {
                  setCustomer(fd);
                  nextStep();
                }}
                onPrev={prevStep}
                bookingDetails={{
                  service: selectedService,
                  date: selectedDate,
                  time: selectedTime,
                }}
              />
            )}

            {currentStep === 4 && !bookingComplete && (
              <section>
                <h2 className="text-xl font-semibold mb-2" style={{ color: TEXT }}>
                  Ellenőrzés & véglegesítés
                </h2>
                <p className="text-sm mb-6" style={{ color: MUTED }}>
                  Kérjük, ellenőrizze az adatokat. Ha valamit módosítana, kattintson a <em>Szerkesztés</em> gombra.
                </p>

                <div className="rounded-xl border divide-y overflow-hidden" style={{ borderColor: BORDER }}>
                  <Row label="Szolgáltatás" value={SERVICE_LABEL[selectedService] || "—"} onEdit={() => setCurrentStep(1)} />
                  <Row
                    label="Dátum"
                    value={
                      selectedDate
                        ? new Date(selectedDate + "T00:00:00").toLocaleDateString("hu-HU", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "—"
                    }
                    onEdit={() => setCurrentStep(2)}
                  />
                  <Row label="Időpont" value={selectedTime || "—"} onEdit={() => setCurrentStep(2)} />
                  <Row label="Név" value={customer.name || "—"} onEdit={() => setCurrentStep(3)} />
                  <Row label="Email" value={customer.email || "—"} onEdit={() => setCurrentStep(3)} />
                  <Row label="Telefon" value={customer.phone || "—"} onEdit={() => setCurrentStep(3)} />
                  <Row label="Megjegyzés" value={customer.notes || "—"} onEdit={() => setCurrentStep(3)} />
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 h-11 rounded-lg border"
                    style={{ borderColor: BORDER, color: TEXT }}
                  >
                    Vissza
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!canGoToStep4}
                    className="px-5 h-11 rounded-lg font-medium text-white disabled:opacity-50"
                    style={{
                      background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT_600} 100%)`,
                    }}
                  >
                    Foglalás véglegesítése
                  </button>
                </div>
              </section>
            )}

            {currentStep === 4 && bookingComplete && (
              <section aria-live="polite" aria-atomic="true" className="text-center py-6">
                <div className="flex justify-center mb-3">
                  <CheckCircle2 size={56} style={{ color: ACCENT_600 as any }} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: TEXT }}>
                  Foglalás sikeresen rögzítve!
                </h3>
                <p className="text-sm mb-6" style={{ color: MUTED }}>
                  Hozzáadhatja a naptárához is.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleICSDownload}
                    className="px-4 h-11 rounded-lg border"
                    style={{ borderColor: BORDER, color: TEXT }}
                  >
                    Naptárhoz adás (.ics)
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="px-5 h-11 rounded-lg font-medium text-white"
                    style={{
                      background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT_600} 100%)`,
                    }}
                  >
                    Új foglalás
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Desktop összegző */}
        <Summary />
      </div>
    </div>
  );
}

/** Ellenőrző sor */
function Row({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-2 text-sm underline"
        style={{ color: ACCENT as any }}
      >
        <Pencil size={16} />
        Szerkesztés
      </button>
    </div>
  );
}
