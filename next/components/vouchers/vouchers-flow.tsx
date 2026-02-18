// next/components/vouchers/vouchers-flow.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { StrapiImage } from "@/components/ui/strapi-image";
import { cn } from "@/lib/utils";
import {
    Check,
    Copy,
    Mail,
    HelpCircle,
    ArrowLeft,
    AlertTriangle,
    Lock,
    PencilLine,
    Landmark,
    ArrowRight,
} from "lucide-react";
import { t } from "@/components/vouchers/i18n";

type StepKey = "select" | "personalize" | "transfer";

type Voucher = {
    id: number;
    documentId?: string;
    heading?: string;
    sub_heading?: string;
    price?: string;
    image?: any;
    logo?: any;
};

type ButtonComp = {
    text?: string;
    URL?: string;
    variant?: string;
    target?: string;
};

type PageData = {
    heading?: string;
    sub_heading?: string;

    steps?: Array<{ kicker?: string; title?: string; key?: StepKey }>;

    voucher_picker_title?: string;

    personalization_title?: string;
    recipient_name_label?: string;
    recipient_name_placeholder?: string;
    message_label?: string;
    message_placeholder?: string;

    button?: ButtonComp[];

    help_title?: string;
    help_text?: string;
    help_button?: ButtonComp;

    bank_transfer?: {
        section_title?: string;
        beneficiary_label?: string;
        beneficiary_name?: string;
        account_label?: string;
        account_number?: string;
        amount_label?: string;
        amount_hint?: string;
        reference_label?: string;
        reference_hint?: string;
        warning_text?: string;
        delivery_note?: string;
    };

    success_title?: string;
    success_subtitle?: string;
    back_to_home_label?: string;
};

const spring = { type: "spring" as const, stiffness: 520, damping: 34, mass: 0.7 };

function pickPrimaryButton(page: PageData, fallbackText: string) {
    const btn = page?.button?.[0];
    return { text: btn?.text || fallbackText, href: btn?.URL || "" };
}

// ✅ Robusztus Strapi component olvasás (v4/v5, object/array/data/attributes)
function getComponentButton(anyVal: any): ButtonComp | null {
    if (!anyVal) return null;

    if (Array.isArray(anyVal)) return (anyVal[0] ?? null) as any;
    if (anyVal?.data?.attributes) return anyVal.data.attributes as any;
    if (anyVal?.attributes) return anyVal.attributes as any;
    return anyVal as any;
}

function getImgUrl(v: Voucher) {
    return v?.image?.url || v?.image?.data?.attributes?.url || v?.image?.data?.url || "";
}

// ✅ HUF marad fixen
function formatHUF(input?: string) {
    const raw = String(input ?? "").trim();
    if (!raw) return "";
    const digits = raw.replace(/[^\d]/g, "");
    const n = Number(digits);
    if (!Number.isFinite(n) || n <= 0) return raw;
    return new Intl.NumberFormat("hu-HU").format(n) + " Ft";
}

function emailLooksOk(e: string) {
    const s = e.trim();
    return s.includes("@") && s.includes(".");
}

async function safeCopy(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}


export function VouchersFlow({
    page,
    vouchers,
    locale,
}: {
    page: PageData;
    vouchers: Voucher[];
    locale: string;
}) {
    const [step, setStep] = useState<StepKey>("select");
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const selectedVoucher = useMemo(
        () => vouchers.find((v) => v.id === selectedId) ?? null,
        [vouchers, selectedId]
    );

    const [recipientName, setRecipientName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [order, setOrder] = useState<any | null>(null);

    // ✅ scroll targets
    const flowTopRef = useRef<HTMLDivElement | null>(null);
    const personalizeRef = useRef<HTMLDivElement | null>(null);

    // ✅ Mobile-only scroll to personalize panel
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 1023px)"); // < lg
        const apply = () => setIsMobile(mq.matches);
        apply();
        mq.addEventListener?.("change", apply);
        return () => mq.removeEventListener?.("change", apply);
    }, []);

    function scrollToPersonalize() {
        if (!isMobile) return;
        requestAnimationFrame(() => {
            personalizeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    function scrollToTop() {
        requestAnimationFrame(() => {
            flowTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    // ✅ fallback step szövegek i18n-ből (kicker egyszerű számozás)
    const steps: Array<{ kicker?: string; title?: string; key?: StepKey }> = page?.steps?.length
        ? page.steps
        : [
            { kicker: "1", title: t(locale, "pickVoucher"), key: "select" },
            { kicker: "2", title: t(locale, "personalize"), key: "personalize" },
            { kicker: "3", title: t(locale, "bankTransfer"), key: "transfer" },
        ];

    const activeIdx = useMemo(() => {
        const map: Record<StepKey, number> = { select: 0, personalize: 1, transfer: 2 };
        return map[step] ?? 0;
    }, [step]);

    function go(next: StepKey) {
        setErr(null);
        setStep(next);
    }

    function canSubmit() {
        if (!selectedVoucher) return false;
        if (!recipientName.trim()) return false;
        if (!emailLooksOk(email)) return false;
        return true;
    }

    async function createOrder() {
        if (!canSubmit()) return;

        setBusy(true);
        setErr(null);

        try {
            if (!selectedVoucher) throw new Error(t(locale, "chooseLeft"));

            // ✅ Strapi v5: a backend oldalon úgyis validálod,
            // itt pedig egyetlen "kulcsot" küldünk (documentId preferált)
            const voucherKey = selectedVoucher.documentId ?? selectedVoucher.id;
            if (!voucherKey) throw new Error("Missing voucher identifier.");

            // ✅ FONTOS: relatív /api - így nem tud duplázódni (/api/api)
            const res = await fetch(`/api/voucher-orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: {
                        name: recipientName,
                        email,
                        message,
                        voucher: voucherKey,
                    },
                }),
                cache: "no-store",
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Order create error (${res.status}). ${txt}`);
            }

            const created = await res.json();
            const createdKey = (created?.data?.documentId ??
                created?.data?.id ??
                created?.documentId ??
                created?.id) as string | number | undefined;

            if (!createdKey) {
                setOrder(created?.data ?? created);
                go("transfer");
                scrollToTop();
                return;
            }

            // fetch again to ensure reference_code exists
            const res2 = await fetch(`/api/voucher-orders/${createdKey}?populate=*`, { cache: "no-store" });

            if (!res2.ok) {
                setOrder(created?.data ?? created);
                go("transfer");
                scrollToTop();
                return;
            }

            const full = await res2.json();
            setOrder(full?.data ?? full);

            go("transfer");
            scrollToTop();
        } catch (e: any) {
            setErr(e?.message || "Unknown error");
        } finally {
            setBusy(false);
        }
    }

    // ✅ buy button fallback is ok to keep HU if you want (Strapi overrides anyway)
    const buyBtn = pickPrimaryButton(page, "MEGVÁSÁROLOM");

    const referenceCode =
        order?.attributes?.reference_code ??
        order?.reference_code ??
        order?.attributes?.referenceCode ??
        "";

    const helpBtn = getComponentButton(page?.help_button);

    const rightPanelSelected = !!selectedVoucher;

    // small helper for consistent "icon bubble"
    const iconBubble =
        "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#057C80]/10 text-[#057C80]";

    return (
        <div ref={flowTopRef} className="w-full scroll-mt-24">
            {/* HERO */}
            <div className="mx-auto mb-10 text-left md:mb-16">
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 md:text-7xl">
                    {page?.heading ?? t(locale, "heroFallback")}
                </h1>
                {page?.sub_heading ? (
                    <p className="mt-4 max-w-2xl text-left text-sm text-neutral-500 md:text-lg">
                        {page.sub_heading}
                    </p>
                ) : null}
            </div>

            {/* ✅ STEPPER: mobilon vertikális / desktopon a régi. Step3-on ne látszódjon */}
            {step !== "transfer" ? (
                <div className="mx-auto mt-10 max-w-5xl">
                    {/* Mobile */}
                    <div className="md:hidden">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="space-y-4">
                                {steps.slice(0, 3).map((s, i) => {
                                    const active = i === activeIdx;
                                    const done = i < activeIdx;

                                    return (
                                        <div key={s.key ?? i} className="flex items-start gap-3">
                                            <div className="relative">
                                                <div
                                                    className={cn(
                                                        "grid h-9 w-9 place-items-center rounded-full border text-sm font-semibold",
                                                        done || active
                                                            ? "border-[#057C80] bg-[#057C80] text-white"
                                                            : "border-slate-200 bg-slate-100 text-slate-500"
                                                    )}
                                                >
                                                    {done ? <Check className="h-5 w-5" /> : i + 1}
                                                </div>
                                                {i < 2 ? <div className="mx-auto mt-2 h-6 w-px bg-slate-200" /> : null}
                                            </div>

                                            <div className="leading-tight pt-1">
                                                <div className="text-[11px] font-semibold tracking-wide text-slate-400">
                                                    {s.kicker}
                                                </div>
                                                <div
                                                    className={cn(
                                                        "text-sm font-semibold",
                                                        active ? "text-slate-900" : "text-slate-500"
                                                    )}
                                                >
                                                    {s.title}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Desktop (target design) */}
                    <div className="hidden md:block">
                        <div className="flex items-center justify-center gap-10">
                            {steps.slice(0, 3).map((s, i) => {
                                const active = i === activeIdx;
                                const done = i < activeIdx;
                                const isBankStep = i === 2;

                                return (
                                    <React.Fragment key={s.key ?? i}>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    "grid h-12 w-12 place-items-center rounded-full border text-sm font-semibold shadow-sm",
                                                    done || active
                                                        ? "border-[#057C80] bg-[#057C80] text-white"
                                                        : "border-slate-200 bg-slate-100 text-slate-500"
                                                )}
                                            >
                                                {done ? (
                                                    <Check className="h-5 w-5" />
                                                ) : isBankStep ? (
                                                    <Landmark
                                                        className={cn(
                                                            "h-5 w-5",
                                                            done || active ? "text-white" : "text-[#057C80]"
                                                        )}
                                                    />
                                                ) : (
                                                    i + 1
                                                )}
                                            </div>

                                            <div className="leading-tight">
                                                <div className="text-[11px] font-semibold tracking-wide text-slate-400">
                                                    {s.kicker}
                                                </div>
                                                <div
                                                    className={cn(
                                                        "text-sm font-semibold",
                                                        active ? "text-slate-900" : "text-slate-500"
                                                    )}
                                                >
                                                    {s.title}
                                                </div>
                                            </div>
                                        </div>

                                        {i < 2 ? <div className="h-[2px] w-20 bg-slate-200" /> : null}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* BODY */}
            <div className="mx-auto mt-10 max-w-6xl">
                {step === "transfer" ? (
                    <TransferSuccess
                        page={page}
                        locale={locale}
                        bank={page?.bank_transfer}
                        referenceCode={referenceCode}
                        amount={selectedVoucher?.price}
                        helpBtn={helpBtn}
                    />
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* LEFT */}
                            <div className="rounded-3xl border border-slate-200 bg-white p-6">
                                {/* title with icon */}
                                <div className="mb-5 flex items-center gap-3">
                                    <span className={iconBubble}>
                                        <Lock className="h-5 w-5 md:h-4 md:w-4" />
                                    </span>
                                    <div className="text-sm font-semibold text-slate-900">
                                        {page?.voucher_picker_title ?? t(locale, "pickVoucher")}
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={spring}
                                    >
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {vouchers.map((v) => {
                                                const selected = v.id === selectedId;
                                                const imgUrl = getImgUrl(v);

                                                return (
                                                    <button
                                                        key={v.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedId(v.id);
                                                            if (step === "select") go("personalize");
                                                            scrollToPersonalize();
                                                        }}
                                                        className={cn(
                                                            "group rounded-2xl border p-3 text-left transition",
                                                            selected
                                                                ? "border-[#057C80] shadow-sm ring-2 ring-[#057C80]/15"
                                                                : "border-slate-200 hover:border-slate-300"
                                                        )}
                                                    >
                                                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                                                            {imgUrl ? (
                                                                <StrapiImage
                                                                    src={imgUrl}
                                                                    alt={v.heading ?? ""}
                                                                    fill
                                                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                                                />
                                                            ) : null}
                                                        </div>

                                                        <div className="mt-3">
                                                            <div className="text-sm font-semibold text-slate-900">{v.heading}</div>
                                                            {v.sub_heading ? (
                                                                <div className="mt-1 text-xs text-slate-600">{v.sub_heading}</div>
                                                            ) : null}
                                                            {v.price ? (
                                                                <div className="mt-3 text-base font-semibold text-[#057C80]">
                                                                    {formatHUF(v.price)}
                                                                </div>
                                                            ) : null}
                                                        </div>

                                                        <div className="mt-3">
                                                            <span
                                                                className={cn(
                                                                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                                                                    selected ? "bg-[#057C80] text-white" : "bg-slate-100 text-slate-800"
                                                                )}
                                                            >
                                                                {selected ? t(locale, "selected") : t(locale, "select")}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* RIGHT */}
                            <div
                                ref={personalizeRef}
                                className={cn(
                                    "scroll-mt-24 rounded-3xl border bg-white p-6 transition",
                                    rightPanelSelected
                                        ? "border-[#057C80] ring-2 ring-[#057C80]/15"
                                        : "border-slate-200"
                                )}
                            >
                                <div className="mb-5 flex items-center gap-3">
                                    <span className={iconBubble}>
                                        <PencilLine className="h-5 w-5 md:h-4 md:w-4" />
                                    </span>
                                    <div className="text-sm font-semibold text-slate-900">
                                        {page?.personalization_title ?? t(locale, "personalize")}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-semibold tracking-wide text-slate-500">
                                            {page?.recipient_name_label ?? t(locale, "recipientName")}
                                        </label>
                                        <input
                                            value={recipientName}
                                            onChange={(e) => setRecipientName(e.target.value)}
                                            placeholder={page?.recipient_name_placeholder ?? ""}
                                            disabled={!selectedVoucher}
                                            className={cn(
                                                "mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none",
                                                "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#057C80]/40",
                                                !selectedVoucher && "opacity-60"
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold tracking-wide text-slate-500">
                                            {t(locale, "email")}
                                        </label>
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="anna@gmail.com"
                                            disabled={!selectedVoucher}
                                            className={cn(
                                                "mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none",
                                                "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#057C80]/40",
                                                !selectedVoucher && "opacity-60"
                                            )}
                                        />
                                        {!emailLooksOk(email) && email.trim() ? (
                                            <div className="mt-2 text-xs text-rose-600">{t(locale, "invalidEmail")}</div>
                                        ) : null}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold tracking-wide text-slate-500">
                                            {page?.message_label ?? t(locale, "message")}
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder={page?.message_placeholder ?? ""}
                                            disabled={!selectedVoucher}
                                            className={cn(
                                                "mt-2 min-h-[120px] w-full rounded-xl border px-4 py-3 text-sm outline-none",
                                                "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#057C80]/40",
                                                !selectedVoucher && "opacity-60"
                                            )}
                                        />
                                    </div>

                                    <div className="pt-2 text-xs text-slate-600">
                                        <div className="flex items-center justify-between py-1">
                                            <span>{t(locale, "selectedVoucher")}</span>
                                            <span className="font-semibold text-slate-900">{selectedVoucher?.heading ?? "—"}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1">
                                            <span>{t(locale, "delivery")}</span>
                                            <span className="font-semibold text-slate-900">{t(locale, "deliveryValue")}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1">
                                            <span>{t(locale, "payment")}</span>
                                            <span className="inline-flex items-center gap-1 font-semibold text-[#057C80]">
                                                <Landmark className="h-4 w-4" />
                                                {t(locale, "bankTransfer")}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-2 flex items-end justify-between">
                                        <div className="text-sm font-semibold text-slate-900">{t(locale, "total")}</div>
                                        <div className="text-2xl font-semibold text-[#057C80]">
                                            {selectedVoucher?.price ? formatHUF(selectedVoucher.price) : "—"}
                                        </div>
                                    </div>

                                    {err ? (
                                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                            {err}
                                        </div>
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={createOrder}
                                        disabled={!canSubmit() || busy}
                                        className={cn(
                                            "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold transition",
                                            !canSubmit() || busy
                                                ? "bg-slate-200 text-slate-500"
                                                : "bg-[#057C80] text-white hover:bg-[#00969e]"
                                        )}
                                    >
                                        {busy ? t(locale, "processing") : buyBtn.text}
                                        <ArrowRight className="h-4 w-4" />
                                    </button>

                                    {page?.bank_transfer?.warning_text ? (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 md:text-[11px]">
                                            <div className="flex items-center gap-3">
                                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-900">
                                                    <AlertTriangle className="h-5 w-5 md:h-4 md:w-4" />
                                                </span>
                                                <div className="leading-snug">{page.bank_transfer.warning_text}</div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {(page?.help_title || page?.help_text || helpBtn?.text) ? (
                            <div className="mx-auto mt-6 max-w-6xl">
                                <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#057C80]/10 text-[#057C80]">
                                                <HelpCircle className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900">{page?.help_title ?? ""}</div>
                                                {page?.help_text ? (
                                                    <div className="mt-1 text-sm text-slate-600">{page.help_text}</div>
                                                ) : null}
                                            </div>
                                        </div>

                                        {helpBtn?.text && helpBtn?.URL ? (
                                            <a
                                                href={helpBtn.URL}
                                                target={helpBtn.target === "_blank" ? "_blank" : undefined}
                                                rel={helpBtn.target === "_blank" ? "noreferrer" : undefined}
                                                className="inline-flex w-full items-center justify-center rounded-2xl border border-[#057C80]/45 bg-white px-5 py-3 text-sm font-semibold text-[#057C80] transition hover:bg-[#057C80]/10 md:w-auto"
                                            >
                                                {helpBtn.text}
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}

function TransferSuccess({
    page,
    locale,
    bank,
    referenceCode,
    amount,
    helpBtn,
}: {
    page: PageData;
    locale: string;
    bank?: PageData["bank_transfer"];
    referenceCode: string;
    amount?: string;
    helpBtn: ButtonComp | null;
}) {
    const amountText = formatHUF(amount);

    return (
        <div className="mx-auto max-w-4xl">
            <div className="flex flex-col items-center text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#057C80]/10 text-[#057C80]">
                    <Check className="h-7 w-7" />
                </div>

                <div className="mt-3 rounded-full bg-[#057C80]/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#057C80]">
                    {t(locale, "orderPlaced")}
                </div>

                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                    {page?.success_title ?? t(locale, "thanks")}
                </h2>

                {page?.success_subtitle ? (
                    <p className="mt-4 max-w-2xl text-base text-slate-600">{page.success_subtitle}</p>
                ) : null}
            </div>

            <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
                <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#057C80]/10 text-[#057C80]">
                        <Landmark className="h-5 w-5 md:h-4 md:w-4" />
                    </span>
                    <div className="text-sm font-semibold text-slate-900">
                        {bank?.section_title ?? t(locale, "transferDetails")}
                    </div>
                </div>

                <div className="mt-5 space-y-4">
                    <BankRow
                        locale={locale}
                        label={bank?.beneficiary_label ?? t(locale, "beneficiary")}
                        value={bank?.beneficiary_name ?? ""}
                        copyValue={bank?.beneficiary_name ?? ""}
                        variant="normal"
                    />
                    <BankRow
                        locale={locale}
                        label={bank?.account_label ?? t(locale, "account")}
                        value={bank?.account_number ?? ""}
                        copyValue={bank?.account_number ?? ""}
                        variant="normal"
                    />
                    <BankRow
                        locale={locale}
                        label={bank?.amount_label ?? t(locale, "amount")}
                        value={amountText}
                        copyValue={amountText}
                        variant="amount"
                    />
                    <BankRow
                        locale={locale}
                        label={bank?.reference_label ?? t(locale, "reference")}
                        value={referenceCode || "—"}
                        copyValue={referenceCode || ""}
                        variant="reference"
                    />
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                                <Mail className="h-5 w-5" />
                            </span>
                            <div>
                                <div className="text-sm font-semibold text-slate-900">{t(locale, "delivery")}</div>
                                <div className="mt-2 text-sm text-slate-600">
                                    {bank?.delivery_note ? bank.delivery_note : t(locale, "deliveryValue")}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700">
                                <HelpCircle className="h-5 w-5" />
                            </span>
                            <div className="w-full">
                                <div className="text-sm font-semibold text-slate-900">
                                    {page?.help_title ?? t(locale, "helpFallback")}
                                </div>
                                {page?.help_text ? <div className="mt-2 text-sm text-slate-600">{page.help_text}</div> : null}

                                {helpBtn?.text && helpBtn?.URL ? (
                                    <a
                                        href={helpBtn.URL}
                                        target={helpBtn.target === "_blank" ? "_blank" : undefined}
                                        rel={helpBtn.target === "_blank" ? "noreferrer" : undefined}
                                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#057C80] hover:text-[#00969e]"
                                    >
                                        {helpBtn.text}
                                        <span aria-hidden>→</span>
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex justify-center">
                    <a
                        href={`/${locale}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {page?.back_to_home_label ?? t(locale, "backHome")}
                    </a>
                </div>
            </div>
        </div>
    );
}

function BankRow({
  locale,
  label,
  value,
  copyValue,
  variant,
}: {
  locale: string;
  label: string;
  value: string;
  copyValue?: string;
  variant: "normal" | "reference" | "amount";
}) {
  const canCopy = !!copyValue;

  const [copied, setCopied] = React.useState(false);
  const [copyErr, setCopyErr] = React.useState(false);

  useEffect(() => {
    if (!copied) return;
    const tmr = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(tmr);
  }, [copied]);

  useEffect(() => {
    if (!copyErr) return;
    const tmr = window.setTimeout(() => setCopyErr(false), 1600);
    return () => window.clearTimeout(tmr);
  }, [copyErr]);

  const tone =
    variant === "reference"
      ? "border-[#057C80]/20 bg-[#057C80]/10"
      : "border-slate-200 bg-slate-50";

  const valueTone =
    variant === "reference"
      ? "text-[#057C80]"
      : variant === "amount"
      ? "text-[#057C80]"
      : "text-slate-900";

  const ringTone = copied
    ? "ring-2 ring-emerald-300/60"
    : copyErr
    ? "ring-2 ring-rose-300/60"
    : "";

  async function onCopy() {
    if (!copyValue) return;
    const ok = await safeCopy(copyValue);
    if (ok) {
      setCopyErr(false);
      setCopied(true);
    } else {
      setCopied(false);
      setCopyErr(true);
    }
  }

  const buttonLabel = copied
    ? `${t(locale, "copyTitle")}: ✓`
    : copyErr
    ? `${t(locale, "copyTitle")}: ✕`
    : t(locale, "copyTitle");

  const buttonTitle = copied
    ? (locale.startsWith("hu")
        ? "Kimásolva!"
        : locale.startsWith("de")
        ? "Kopiert!"
        : "Copied!")
    : copyErr
    ? (locale.startsWith("hu")
        ? "Nem sikerült a másolás"
        : locale.startsWith("de")
        ? "Kopieren fehlgeschlagen"
        : "Copy failed")
    : t(locale, "copyTitle");

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4 transition",
        tone,
        ringTone,
        copied && "animate-[pulse_0.6s_ease-out_1]"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold tracking-wide text-slate-500">
            {label.toUpperCase()}
          </div>

          <div className={cn("mt-1 font-semibold leading-snug", "text-base md:text-sm", valueTone)}>
            <span className="break-words">{value}</span>
          </div>

          {/* mini inline feedback (mobilon tök jó) */}
          {copied ? (
            <div className="mt-1 text-[11px] font-semibold text-emerald-700">
              {locale.startsWith("hu") ? "Kimásolva!" : locale.startsWith("de") ? "Kopiert!" : "Copied!"}
            </div>
          ) : copyErr ? (
            <div className="mt-1 text-[11px] font-semibold text-rose-700">
              {locale.startsWith("hu")
                ? "Nem sikerült a másolás"
                : locale.startsWith("de")
                ? "Kopieren fehlgeschlagen"
                : "Copy failed"}
            </div>
          ) : null}
        </div>

        {canCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className={cn(
              "shrink-0 inline-flex items-center justify-center transition",
              "h-10 w-10 rounded-xl border border-slate-200 bg-white",
              copied
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : copyErr
                ? "text-rose-700 bg-rose-50 border-rose-200"
                : "text-[#057C80] hover:bg-slate-100",
              "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#057C80]/20"
            )}
            aria-label={buttonLabel}
            title={buttonTitle}
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

