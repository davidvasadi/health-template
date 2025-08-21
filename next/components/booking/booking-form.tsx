"use client";

import React, { useState } from "react";
import { User, Phone, Mail, Calendar, Clock, Activity } from "lucide-react";

const ACCENT = "var(--accent, #0ea5a6)";
const BORDER = "#E5E7EB";
const TEXT = "#0B1220";
const MUTED = "#667085";

type BookingDetails = { service: string; date: string; time: string };
type FormData = { name: string; email: string; phone: string; notes: string };

type Props = {
  onSubmit: (formData: FormData) => void;
  onPrev: () => void;
  bookingDetails: BookingDetails;
};

export function BookingForm({ onSubmit, onPrev, bookingDetails }: Props) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const valid = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Kérjük, adja meg a nevét";
    if (!formData.email.trim()) e.email = "Kérjük, adja meg az email címét";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Érvényes emailt adjon meg";
    if (!formData.phone.trim()) e.phone = "Kérjük, adja meg a telefonszámát";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (evt: React.FormEvent) => {
    evt.preventDefault();
    if (valid()) onSubmit(formData);
  };

  const formatHu = (dStr: string) => {
    if (!dStr) return "";
    const date = new Date(dStr + "T00:00:00");
    return date.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const serviceLabel =
    bookingDetails.service === "basic"
      ? "Alap kezelés"
      : bookingDetails.service === "comprehensive"
      ? "Átfogó kezelés"
      : bookingDetails.service === "premium"
      ? "Prémium kezelés"
      : "—";

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2" style={{ color: TEXT }}>
        Személyes adatok
      </h2>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Kérjük, adja meg az adatait a foglalás ellenőrzéséhez és véglegesítéséhez.
      </p>

      {/* Összegzés sáv */}
      <div className="mb-6 p-4 rounded-xl border" style={{ borderColor: "#c7fffa", background: "#effefd" }}>
        <h3 className="font-medium mb-3" style={{ color: ACCENT as any }}>Foglalás összegzése</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center">
            <Activity size={18} style={{ color: ACCENT as any, marginRight: 8 }} />
            <span className="text-gray-700">{serviceLabel}</span>
          </div>
          <div className="flex items-center">
            <Calendar size={18} style={{ color: ACCENT as any, marginRight: 8 }} />
            <span className="text-gray-700">{formatHu(bookingDetails.date)}</span>
          </div>
          <div className="flex items-center">
            <Clock size={18} style={{ color: ACCENT as any, marginRight: 8 }} />
            <span className="text-gray-700">{bookingDetails.time || "—"}</span>
          </div>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: TEXT }}>Teljes név</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                name="name"
                value={formData.name}
                onChange={change}
                className={`pl-10 w-full p-3 border rounded-lg focus:ring-2 outline-none transition
                  ${errors.name ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-teal-200"}
                  text-gray-900 placeholder-gray-400 bg-white`}
                placeholder="Kovács János"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: TEXT }}>Email cím</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={change}
                className={`pl-10 w-full p-3 border rounded-lg focus:ring-2 outline-none transition
                  ${errors.email ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-teal-200"}
                  text-gray-900 placeholder-gray-400 bg-white`}
                placeholder="email@pelda.hu"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: TEXT }}>Telefonszám</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone size={18} className="text-gray-400" />
              </div>
              <input
                name="phone"
                value={formData.phone}
                onChange={change}
                className={`pl-10 w-full p-3 border rounded-lg focus:ring-2 outline-none transition
                  ${errors.phone ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-teal-200"}
                  text-gray-900 placeholder-gray-400 bg-white`}
                placeholder="+36 30 123 4567"
              />
            </div>
            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: TEXT }}>Megjegyzés (opcionális)</label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={change}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-200 outline-none transition text-gray-900 placeholder-gray-400 bg-white"
              placeholder="Írja le panaszait vagy egyéb kéréseit..."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={onPrev}
            className="px-6 py-3 border rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            style={{ borderColor: BORDER }}
          >
            Vissza
          </button>
          <button
            type="submit"
            className="px-6 py-3 rounded-lg font-medium text-white"
            style={{ background: ACCENT as any }}
          >
            Tovább az ellenőrzéshez
          </button>
        </div>
      </form>
    </section>
  );
}
