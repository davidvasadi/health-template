"use client";

import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/elements/button";
import type { FormInput as BaseFormInput } from "./types";

type InputDef = BaseFormInput & {
  required?: boolean;
  minLength?: number;
  pattern?: string;
  helpText?: string;
};

type Props = {
  inputs?: BaseFormInput[];
  action?: string;
  onSuccess?: (payload: Record<string, any>) => void;
  onError?: (error: unknown) => void;
  hiddenFields?: Record<string, any>;
};

/** --- Locale & i18n (HU/EN/DE) --- */
type SupportedLocale = "hu" | "en" | "de";

function resolveLocale(): SupportedLocale {
  if (typeof window !== "undefined") {
    const htmlLang = document?.documentElement?.lang?.toLowerCase?.() || "";
    const seg = window?.location?.pathname?.split?.("/")?.[1]?.toLowerCase?.() || "";
    const raw = htmlLang || seg;
    if (raw.startsWith("hu")) return "hu";
    if (raw.startsWith("de")) return "de";
  }
  return "en";
}

const L = {
  en: {
    errors: {
      required: "This field is required.",
      email: "Invalid email format.",
      tel: "Please enter a valid phone number.",
      minLength: (n: number) => `At least ${n} characters required.`,
      pattern: "Invalid format.",
    },
    status: {
      checkFields: "Please check the highlighted fields.",
      success: "Thank you! We will get back to you soon.",
      failGeneric: "Oops, something went wrong. Please try again later.",
      sending: "Sending...",
    },
    ctaSend: "Send",
  },
  hu: {
    errors: {
      required: "Kötelező mező.",
      email: "Érvénytelen email formátum.",
      tel: "Adj meg érvényes telefonszámot.",
      minLength: (n: number) => `Legalább ${n} karakter szükséges.`,
      pattern: "Érvénytelen formátum.",
    },
    status: {
      checkFields: "Kérjük, ellenőrizd a megjelölt mezőket.",
      success: "Köszönjük! Hamarosan jelentkezünk.",
      failGeneric: "Hoppá, most nem sikerült. Próbáld újra később.",
      sending: "Küldés...",
    },
    ctaSend: "Küldés",
  },
  de: {
    errors: {
      required: "Pflichtfeld.",
      email: "Ungültiges E-Mail-Format.",
      tel: "Bitte gib eine gültige Telefonnummer ein.",
      minLength: (n: number) => `Mindestens ${n} Zeichen erforderlich.`,
      pattern: "Ungültiges Format.",
    },
    status: {
      checkFields: "Bitte überprüfe die markierten Felder.",
      success: "Danke! Wir melden uns in Kürze.",
      failGeneric: "Ups, etwas ist schiefgelaufen. Bitte später erneut versuchen.",
      sending: "Senden...",
    },
    ctaSend: "Senden",
  },
} as const;

/** --- Component --- */
export function ContactForm({
  inputs = [],
  action = "/api/contact",
  onSuccess,
  onError,
  hiddenFields,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstErrorRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const locale = resolveLocale();
  const T = L[locale];

  const normKey = (raw?: string, idx?: number) =>
    (raw
      ? raw
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^\w-]/g, "")
      : `field_${idx}`);

  /** Normalizált definíciók — Név/Email/Telefon KÖTELEZŐ */
  const defs: Array<InputDef & { _id: string; _name: string }> = useMemo(() => {
    return (inputs as InputDef[]).map((inp, idx) => {
      const _id = inp?.name || `field-${idx}`;
      const _name = normKey(inp?.name, idx);
      const labelLc = (inp?.name || "").toLowerCase();

      const isEmailType = inp?.type === "email";
      const isTelType = inp?.type === "tel";
      const looksLikeName = /(name|név|nev|full\s*name|vorname|nachname)/i.test(labelLc);
      const looksLikePhone = /(telefon|phone|tel\.?)/i.test(labelLc);

      // A user kérésére: Név + Email + Telefon MINDIG kötelező
      const mustRequire = isEmailType || isTelType || looksLikeName || looksLikePhone;

      return {
        ...inp,
        required: mustRequire ? true : !!inp.required,
        _id,
        _name,
      };
    });
  }, [inputs]);

  const isEmpty = (v: unknown) => (typeof v === "string" ? v.trim() === "" : v == null);
  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const isPhone = (v: string) => (v || "").replace(/[^\d]/g, "").length >= 6;

  const validateField = (def: InputDef & { _name: string }, raw: FormDataEntryValue | null) => {
    const val = typeof raw === "string" ? raw : "";
    if (def.required && isEmpty(val)) return T.errors.required;
    if (!isEmpty(val)) {
      if (def.type === "email" && !isEmail(val)) return T.errors.email;
      if (def.type === "tel" && !isPhone(val)) return T.errors.tel;
      if (typeof def.minLength === "number" && val.trim().length < def.minLength)
        return T.errors.minLength(def.minLength);
      if (def.pattern) {
        try {
          if (!new RegExp(def.pattern).test(val)) return T.errors.pattern;
        } catch {}
      }
    }
    return "";
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setStatus(null);
    setIsSubmitting(true);
    firstErrorRef.current = null;

    const formEl = formRef.current;
    if (!formEl) {
      setIsSubmitting(false);
      return;
    }

    try {
      const fd = new FormData(formEl);

      // Honeypot: ha töltve, ne küldjünk tovább
      if ((fd.get("_hp") as string)?.trim()) {
        setStatus({ ok: true, msg: T.status.success });
        setIsSubmitting(false);
        formEl.reset();
        return;
      }

      // kliens oldali validáció
      const newErrors: Record<string, string> = {};
      for (const def of defs) {
        if (def.type === "submit") continue;
        const msg = validateField(def, fd.get(def._name));
        if (msg) {
          newErrors[def._name] = msg;
          if (!firstErrorRef.current) firstErrorRef.current = def._id;
        }
      }
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        document.getElementById(firstErrorRef.current!)?.focus?.();
        setStatus({ ok: false, msg: T.status.checkFields });
        return;
      }

      // payload: a normalizált kulcsok + hiddenFields
      const payload: Record<string, any> = { ...(hiddenFields || {}) };
      fd.forEach((v, k) => (payload[k] = typeof v === "string" ? v.trim() : v));

      // --- Strapi kompatibilis KANONIKUS kulcsok: name / email / phone ---
      const getStr = (k?: string) => {
        if (!k) return "";
        const v = fd.get(k);
        return typeof v === "string" ? v.trim() : "";
        };

      const looksLike = (rx: RegExp) =>
        defs.find((d) =>
          rx.test(
            `${d.name || ""} ${d.placeholder || ""} ${String(d.type || "")}`.toLowerCase()
          )
        );

      // NAME
      const nameDef =
        looksLike(/(^|\b)(név|nev|name|full\s*name|vorname|nachname)(\b|$)/i) ||
        looksLike(/\b(full\s*name)\b/i);
      let nameVal = nameDef ? getStr(nameDef._name) : "";

      if (!nameVal) {
        const firstDef = looksLike(/\b(first\s*name|kereszt|vorname)\b/i);
        const lastDef = looksLike(/\b(last\s*name|vezetéknév|vezeteknev|nachname)\b/i);
        const first = getStr(firstDef?._name);
        const last = getStr(lastDef?._name);
        nameVal = [first, last].filter(Boolean).join(" ").trim();
      }

      // EMAIL
      const emailDef = defs.find((d) => d.type === "email") || looksLike(/\b(e-?mail)\b/i);
      const emailVal = getStr(emailDef?._name);

      // PHONE
      const phoneDef = defs.find((d) => d.type === "tel") || looksLike(/\b(telefon|phone|tel\.?)\b/i);
      const phoneVal = getStr(phoneDef?._name);

      if (nameVal && (payload.name == null || String(payload.name).trim() === "")) payload.name = nameVal;
      if (emailVal && (payload.email == null || String(payload.email).trim() === "")) payload.email = emailVal;
      if (phoneVal && payload.phone == null && payload.tel == null) payload.phone = phoneVal;
      // -------------------------------------------------------------------

      const res = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "";
        try {
          const j = await res.json();
          msg = j?.error?.message || j?.error || "";
        } catch {}
        if (!msg) {
          try {
            msg = await res.text();
          } catch {}
        }
        throw new Error(msg || `HTTP ${res.status}`);
      }

      setStatus({ ok: true, msg: T.status.success });
      setErrors({});
      formEl.reset();
      onSuccess?.(payload);
    } catch (err: any) {
      setStatus({ ok: false, msg: err?.message ? String(err.message) : T.status.failGeneric });
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const revalidateOne = (nameKey: string, def: InputDef, value: string) => {
    const msg = validateField({ ...def, _name: nameKey }, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[nameKey] = msg;
      else delete next[nameKey];
      return next;
    });
  };

  return (
    <form ref={formRef} className="space-y-4" noValidate onSubmit={handleSubmit}>
      {/* HONEYPOT — rejtett mező botoknak */}
      <input type="text" name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {defs.map((input, idx) => {
        if (input.type === "submit") {
          return (
            <div key={`submit-${idx}`} className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="w-full mt-2 bg-breaker-bay-900 hover:bg-breaker-bay-800 active:bg-breaker-bay-950 text-white h-11 rounded-xl shadow-[0_12px_24px_-12px] shadow-breaker-bay-900/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-breaker-bay-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? T.status.sending : input.name || T.ctaSend}
              </Button>
            </div>
          );
        }

        const fieldId = input._id;
        const fieldName = input._name;
        const errorMsg = errors[fieldName];
        const required = !!input.required;

        if (input.type === "textarea") {
          return (
            <div key={fieldId}>
              <label htmlFor={fieldId} className="block text-sm font-medium text-neutral-800">
                {input.name} {required && <span className="text-red-600">*</span>}
              </label>
              <textarea
                id={fieldId}
                name={fieldName}
                rows={4}
                placeholder={input.placeholder}
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? `${fieldId}-error` : undefined}
                onBlur={(e) => revalidateOne(fieldName, input, e.currentTarget.value)}
                onInput={(e) => {
                  if (status) setStatus(null);
                  revalidateOne(fieldName, input, e.currentTarget.value);
                }}
                className={`mt-2 block w-full bg-white px-4 rounded-xl border py-3 shadow-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none sm:text-sm
                  ${
                    errorMsg
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                      : "border-neutral-300/80 focus:ring-breaker-bay-300 focus:border-breaker-bay-500"
                  }`}
              />
              {input.helpText && !errorMsg && <p className="mt-1 text-xs text-neutral-500">{input.helpText}</p>}
              {errorMsg && (
                <p id={`${fieldId}-error`} className="mt-1 text-xs text-red-700">
                  {errorMsg}
                </p>
              )}
            </div>
          );
        }

        return (
          <div key={fieldId}>
            <label htmlFor={fieldId} className="block text-sm font-medium text-neutral-800">
              {input.name} {required && <span className="text-red-600">*</span>}
            </label>
            <input
              id={fieldId}
              name={fieldName}
              type={(input.type as string) || "text"}
              placeholder={input.placeholder}
              aria-required={required || undefined}
              aria-invalid={!!errorMsg}
              aria-describedby={errorMsg ? `${fieldId}-error` : undefined}
              onBlur={(e) => revalidateOne(fieldName, input, e.currentTarget.value)}
              onInput={(e) => {
                if (status) setStatus(null);
                revalidateOne(fieldName, input, e.currentTarget.value);
              }}
              className={`mt-2 block w-full bg-white px-4 rounded-xl border py-3 shadow-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none sm:text-sm
                ${
                  errorMsg
                    ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                    : "border-neutral-300/80 focus:ring-breaker-bay-300 focus:border-breaker-bay-500"
                }`}
            />
            {input.helpText && !errorMsg && <p className="mt-1 text-xs text-neutral-500">{input.helpText}</p>}
            {errorMsg && (
              <p id={`${fieldId}-error`} className="mt-1 text-xs text-red-700">
                {errorMsg}
              </p>
            )}
          </div>
        );
      })}

      {status && (
        <div
          className={`mt-3 text-sm rounded-lg px-3 py-2 ${
            status.ok ? "bg-green-50 text-green-800 ring-1 ring-green-200" : "bg-red-50 text-red-800 ring-1 ring-red-200"
          }`}
        >
          {status.msg}
        </div>
      )}
    </form>
  );
}
