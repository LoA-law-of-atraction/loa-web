"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFormik } from "formik";
import * as Yup from "yup";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import SolarSystemBackground from "@/components/SolarSystemBackground";

const legalName =
  process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME?.trim() || "Banana Sapience";
const companyAddress = process.env.NEXT_PUBLIC_COMPANY_ADDRESS?.trim();
const companyReg = process.env.NEXT_PUBLIC_COMPANY_REGISTRATION_NUMBER?.trim();

const MAX_COMMENT = 500;

const interestOptions = [
  { key: "loaUsage", label: "LoA Usage" },
  { key: "adsSponsorship", label: "Ads & Sponsorship" },
  { key: "partnership", label: "Partnership" },
  { key: "others", label: "Something Else" },
];

const ContactClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      comment: "",
      areaOfInterest: {
        loaUsage: false,
        adsSponsorship: false,
        partnership: false,
        others: false,
      },
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      phone: Yup.string().required("Phone number is required"),
      comment: Yup.string().max(
        MAX_COMMENT,
        `Message must be at most ${MAX_COMMENT} characters`
      ),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      setSubmitError("");
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const base = err.error || "Failed to send notification email";
          const detail =
            typeof err.detail === "string" && err.detail.trim()
              ? err.detail.trim()
              : "";
          throw new Error(detail ? `${base} (${detail})` : base);
        }
        setShowSuccess(true);
        formik.resetForm();
      } catch (error) {
        console.error("Error submitting contact form: ", error);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Could not send your message. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  const commentLen = formik.values.comment.length;

  return (
    <>
      <SolarSystemBackground />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="contact-shell relative z-10 w-full overflow-hidden bg-transparent"
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="aurora-blob aurora-blob--gold" />
          <div className="aurora-blob aurora-blob--teal" />
          <div className="noise-layer" />
        </div>

        <div className="relative mx-auto max-w-[1160px] px-5 pb-16 pt-24 md:px-10 lg:pb-20 lg:pt-28">

          {/* ── Compact page header ── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mb-10 text-center"
          >
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-[#141820]/75 px-3.5 py-1 text-[10px] uppercase tracking-[0.32em] text-purple-300 backdrop-blur-sm">
              <span className="h-1 w-1 rounded-full bg-purple-400/80" />
              Cosmic Support Desk
            </span>
            <h1 className="font-tiempos text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[1.08] text-[#F8F3E8]">
              Let&apos;s align on your next move.
            </h1>
            <p className="mt-3 text-sm text-[#8A96AA]">
              Use the form below, or reach us directly at{" "}
              <a href="mailto:support@loa-lawofattraction.co" className="font-medium text-purple-400 hover:underline underline-offset-2">
                support@loa-lawofattraction.co
              </a>
            </p>
          </motion.div>

          {/* ── Two-column grid ── */}
          {/* Mobile: form first (order-first), sidebar below (order-last) */}
          <div className="grid gap-5 lg:grid-cols-[1fr_1.22fr] lg:items-start">

            {/* ── Sidebar ── */}
            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
              className="order-last lg:order-first relative rounded-[1.75rem] border border-purple-500/15 bg-[#0C0F1A]/85 p-6 text-[#EBE3D2] shadow-[0_20px_50px_rgba(2,3,9,0.4)] backdrop-blur-xl md:p-7"
            >
              {/* Purple glow top-left */}
              <div className="pointer-events-none absolute left-0 top-0 h-40 w-40 rounded-full bg-purple-600/10 blur-3xl" />

              {/* ── Orrery decoration ── */}
              <div className="relative mb-5 flex h-20 items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 220 80"
                  className="w-full max-w-[260px] opacity-60"
                  aria-hidden
                >
                  {/* Outer orbit */}
                  <ellipse cx="110" cy="40" rx="100" ry="22" fill="none" stroke="#8B5CF6" strokeWidth="0.7" strokeDasharray="4 5" />
                  {/* Inner orbit */}
                  <ellipse cx="110" cy="40" rx="62" ry="14" fill="none" stroke="#818CF8" strokeWidth="0.7" strokeDasharray="3 6" />
                  {/* Sun */}
                  <circle cx="110" cy="40" r="5" fill="#A78BFA" opacity="0.9">
                    <animate attributeName="r" values="5;5.8;5" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="110" cy="40" r="8" fill="none" stroke="#8B5CF6" strokeWidth="0.5" opacity="0.3">
                    <animate attributeName="r" values="8;11;8" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
                  </circle>
                  {/* Outer planet (indigo) — orbiting clockwise */}
                  <circle r="3.5" fill="#818CF8" opacity="0.9">
                    <animateMotion dur="12s" repeatCount="indefinite">
                      <mpath href="#outerOrbit" />
                    </animateMotion>
                  </circle>
                  {/* Inner planet (purple) — orbiting counter-clockwise */}
                  <circle r="2.2" fill="#C4B5FD" opacity="0.8">
                    <animateMotion dur="7s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                      <mpath href="#innerOrbit" />
                    </animateMotion>
                  </circle>
                  {/* Tiny distant planet */}
                  <circle r="1.5" fill="#E879F9" opacity="0.7">
                    <animateMotion dur="18s" repeatCount="indefinite" begin="4s">
                      <mpath href="#outerOrbit" />
                    </animateMotion>
                  </circle>
                  {/* Hidden path defs for animateMotion */}
                  <defs>
                    <path id="outerOrbit" d="M 210,40 A 100,22 0 1,1 209.99,40.01" fill="none" />
                    <path id="innerOrbit" d="M 172,40 A 62,14 0 1,1 171.99,40.01" fill="none" />
                  </defs>
                  {/* Star dots */}
                  <circle cx="20" cy="12" r="0.9" fill="white" opacity="0.5">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2.3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="195" cy="8" r="0.7" fill="white" opacity="0.4">
                    <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3.1s" repeatCount="indefinite" begin="1s" />
                  </circle>
                  <circle cx="35" cy="68" r="0.8" fill="white" opacity="0.35">
                    <animate attributeName="opacity" values="0.35;0.8;0.35" dur="2.7s" repeatCount="indefinite" begin="0.5s" />
                  </circle>
                  <circle cx="200" cy="70" r="1" fill="white" opacity="0.45">
                    <animate attributeName="opacity" values="0.45;1;0.45" dur="3.5s" repeatCount="indefinite" begin="1.5s" />
                  </circle>
                </svg>
              </div>

              {/* Heading */}
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#8A93A8]">
                  Direct Line
                </p>
                <h2 className="mt-2 font-tiempos text-[1.65rem] leading-snug text-[#FBF7EF]">
                  Need additional support?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#9AA3B5]">
                  Fill in the form with as much context as you can. The more
                  detail we have, the faster we can help.
                </p>
              </div>

              {/* Divider */}
              <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

              {/* Process steps — compact */}
              <div className="mb-5 space-y-3">
                {[
                  { n: "01", t: "We receive your message", d: "Lands with the right team member." },
                  { n: "02", t: "We review your inquiry", d: "Usually within one business day." },
                  { n: "03", t: "You hear back", d: "A personalised reply to your inbox." },
                ].map((step, i, arr) => (
                  <div key={step.n} className="flex items-start gap-3">
                    <div className="flex shrink-0 flex-col items-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-purple-500/40 bg-[#181F30] text-[9px] font-bold tracking-widest text-purple-400">
                        {step.n}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="mt-1 h-5 w-px bg-gradient-to-b from-purple-500/25 to-transparent" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight text-[#EFE7D7]">{step.t}</p>
                      <p className="mt-0.5 text-xs text-[#7A8498]">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

              {/* Business details */}
              <div className="rounded-xl border border-purple-500/15 bg-[#111828]/60 px-4 py-3.5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#7A8498]">
                  Business
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[#EFE7D7]">{legalName}</p>
                {companyAddress && (
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-[#9AA3B5]">
                    {companyAddress}
                  </p>
                )}
                {companyReg && (
                  <p className="mt-1 text-xs text-[#7A8498]">Reg: {companyReg}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="text-xs text-[#9AA3B5]">Response within <span className="text-[#EFE7D7]">1 business day</span></span>
                </div>
              </div>

            </motion.aside>

            {/* ── Form / Success card ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
              className="order-first lg:order-last contact-form-card relative overflow-hidden rounded-[1.75rem] shadow-[0_30px_60px_rgba(4,8,20,0.55)]"
            >
              {/* Purple accent line at top */}
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/70 to-transparent" />

              {/* Card body */}
              <div className="relative border border-t-0 border-purple-500/20 bg-[#0E1320]/94 backdrop-blur-2xl rounded-b-[1.75rem] overflow-hidden">
                {/* Inner glows */}
                <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-purple-600/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-12 left-4 h-44 w-44 rounded-full bg-indigo-600/08 blur-3xl" />

                <AnimatePresence mode="wait">
                  {showSuccess ? (
                    /* ── Success ── */
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="relative flex min-h-[500px] flex-col items-center justify-center gap-7 p-10 text-center"
                    >
                      {/* Check */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.1 }}
                        className="relative"
                      >
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-700">
                          <motion.svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <motion.path d="M20 6L9 17l-5-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.4 }} />
                          </motion.svg>
                        </div>
                        {/* Ripple */}
                        <motion.div
                          initial={{ scale: 0.7, opacity: 0.7 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          className="absolute inset-0 rounded-full border-2 border-purple-500/50"
                        />
                      </motion.div>

                      <div>
                        <motion.h3
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45 }}
                          className="font-tiempos text-[2rem] text-[#FAF2E6]"
                        >
                          Message Sent
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.58 }}
                          className="mt-2.5 max-w-xs text-sm leading-relaxed text-[#9AA3B5]"
                        >
                          We received your message and will get back to you within one business day.
                        </motion.p>
                      </div>

                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.75 }}
                        onClick={() => setShowSuccess(false)}
                        className="rounded-full border border-purple-500/50 bg-purple-600 px-7 py-2.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-purple-500"
                      >
                        Send another message
                      </motion.button>
                    </motion.div>
                  ) : (
                    /* ── Form ── */
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={formik.handleSubmit}
                      className="relative p-6 md:p-7"
                    >
                      <div className="space-y-4">

                        {/* Name */}
                        <div>
                          <label htmlFor="name" className="field-label">Name</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.name}
                            placeholder="Your full name"
                            className="contact-input h-[44px]"
                          />
                          <AnimatePresence>
                            {formik.touched.name && formik.errors.name && (
                              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="field-error">
                                {formik.errors.name}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Email + Phone */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="email" className="field-label">Email</label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              value={formik.values.email}
                              placeholder="you@company.com"
                              className="contact-input h-[44px]"
                            />
                            <AnimatePresence>
                              {formik.touched.email && formik.errors.email && (
                                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="field-error">
                                  {formik.errors.email}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>

                          <div>
                            <label htmlFor="phone" className="field-label">Phone</label>
                            <PhoneInput
                              placeholder="Enter phone number"
                              value={formik.values.phone}
                              onChange={(phone) => formik.setFieldValue("phone", phone)}
                              onBlur={() => formik.setFieldTouched("phone", true)}
                              defaultCountry="us"
                              name="phone"
                              international
                            />
                            <AnimatePresence>
                              {formik.touched.phone && formik.errors.phone && (
                                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="field-error">
                                  {formik.errors.phone}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Message */}
                        <div>
                          <div className="mb-1.5 flex items-baseline justify-between">
                            <label htmlFor="comment" className="field-label mb-0">Message</label>
                            <span className={`text-[11px] tabular-nums transition-colors ${
                              commentLen >= MAX_COMMENT ? "text-red-400" :
                              commentLen > MAX_COMMENT * 0.85 ? "text-amber-400" :
                              "text-[#6A7488]"
                            }`}>
                              {commentLen}/{MAX_COMMENT}
                            </span>
                          </div>
                          <textarea
                            id="comment"
                            name="comment"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.comment}
                            rows="4"
                            placeholder="Tell us what you are working on and how we can help."
                            className="contact-input min-h-[110px] resize-y py-3"
                          />
                          <AnimatePresence>
                            {formik.touched.comment && formik.errors.comment && (
                              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="field-error">
                                {formik.errors.comment}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Area of interest */}
                        <div className="rounded-xl border border-purple-500/15 bg-[#0C1525]/70 p-4">
                          <h3 className="mb-0.5 text-sm font-semibold text-[#EFE7D7]">Area of interest</h3>
                          <p className="mb-3 text-xs text-[#6A7488]">
                            Pick topics so your message reaches the right team.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {interestOptions.map((option) => {
                              const checked = formik.values.areaOfInterest[option.key];
                              return (
                                <label
                                  key={option.key}
                                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                                    checked
                                      ? "border-purple-500/60 bg-purple-500/15 text-purple-300"
                                      : "border-white/10 bg-white/[0.03] text-[#8A96AA] hover:border-purple-500/30 hover:bg-purple-500/[0.06] hover:text-[#C0C8D8]"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    name={`areaOfInterest.${option.key}`}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    checked={checked}
                                  />
                                  {checked && (
                                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none">
                                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                  {option.label}
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                          {submitError && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-500/8 px-4 py-3 text-sm text-red-300"
                            >
                              <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              {submitError}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Submit */}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="group relative flex h-[48px] w-full items-center justify-center overflow-hidden rounded-xl border border-purple-500/50 bg-purple-600 px-6 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-250 hover:-translate-y-px hover:bg-purple-500 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-65"
                        >
                          {/* Shimmer */}
                          {!isLoading && (
                            <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                              <span className="absolute -left-6 top-0 h-full w-1/3 rotate-12 bg-white/20 blur-lg" />
                            </span>
                          )}
                          <span className="relative flex items-center gap-2">
                            {isLoading ? (
                              <>
                                <span className="sending-dots">
                                  <span /><span /><span />
                                </span>
                                Sending
                              </>
                            ) : (
                              "Send Message"
                            )}
                          </span>
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.section>

      <style jsx global>{`
        /* ── Labels ── */
        .contact-shell .field-label {
          display: block;
          margin-bottom: 0.45rem;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #8a96aa;
        }

        /* ── Errors ── */
        .contact-shell .field-error {
          margin-top: 0.3rem;
          font-size: 0.78rem;
          color: #fca5a5;
        }

        /* ── Text inputs / textarea ── */
        .contact-shell .contact-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(139, 92, 246, 0.2);
          background: rgba(255, 255, 255, 0.05);
          padding: 0 0.85rem;
          color: #f0ebdf;
          font-size: 0.88rem;
          transition: border-color 200ms ease, box-shadow 200ms ease, background 200ms ease;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .contact-shell .contact-input::placeholder {
          color: rgba(200, 208, 224, 0.42);
        }

        .contact-shell .contact-input:focus {
          outline: none;
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
          background: rgba(14, 22, 38, 0.85);
        }

        /* ── Phone input ── */
        .contact-shell .react-international-phone-input-container {
          display: flex;
          border-radius: 0.75rem !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }

        .contact-shell .react-international-phone-input-container:focus-within {
          border-color: rgba(139, 92, 246, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12) !important;
        }

        .contact-shell .react-international-phone-country-selector-button {
          height: 44px;
          background: transparent !important;
          border: none !important;
          border-right: 1px solid rgba(139, 92, 246, 0.15) !important;
          border-radius: 0 !important;
          padding: 0 0.65rem;
          color: #f0ebdf !important;
        }

        .contact-shell .react-international-phone-country-selector-button:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }

        .contact-shell .react-international-phone-input {
          flex: 1;
          height: 44px;
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          color: #f0ebdf !important;
          font-size: 0.88rem;
          padding: 0 0.85rem;
        }

        .contact-shell .react-international-phone-input::placeholder {
          color: rgba(200, 208, 224, 0.42) !important;
        }

        .contact-shell .react-international-phone-input:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        .contact-shell .react-international-phone-country-selector-dropdown {
          background: #0e1625 !important;
          border: 1px solid rgba(139, 92, 246, 0.18) !important;
          border-radius: 0.75rem !important;
          box-shadow: 0 16px 48px rgba(0,0,0,0.65) !important;
          overflow: hidden;
        }

        .contact-shell .react-international-phone-country-selector-dropdown__list-item {
          color: #c8cfd8 !important;
          padding: 0.45rem 0.75rem !important;
          font-size: 0.85rem !important;
        }

        .contact-shell .react-international-phone-country-selector-dropdown__list-item:hover,
        .contact-shell .react-international-phone-country-selector-dropdown__list-item--focused {
          background: rgba(255,255,255,0.07) !important;
          color: #f0ebdf !important;
        }

        /* ── Sending dots ── */
        .contact-shell .sending-dots {
          display: inline-flex;
          gap: 3px;
          align-items: center;
        }

        .contact-shell .sending-dots span {
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.8);
          animation: sendingPulse 1.1s ease-in-out infinite;
        }

        .contact-shell .sending-dots span:nth-child(2) { animation-delay: 0.18s; }
        .contact-shell .sending-dots span:nth-child(3) { animation-delay: 0.36s; }

        @keyframes sendingPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40%           { opacity: 1;   transform: scale(1);   }
        }

        /* ── Aurora blobs ── */
        .contact-shell .aurora-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(70px);
          animation: auroraDrift 22s ease-in-out infinite alternate;
        }

        .contact-shell .aurora-blob--gold {
          width: 380px; height: 380px;
          left: -100px; top: 60px;
          background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%);
        }

        .contact-shell .aurora-blob--teal {
          width: 440px; height: 440px;
          right: -120px; top: 5%;
          background: radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%);
          animation-delay: 7s;
        }

        .contact-shell .noise-layer {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(rgba(255,255,255,0.055) 0.45px, transparent 0.45px),
            radial-gradient(rgba(255,255,255,0.03)  0.45px, transparent 0.45px);
          background-size: 3px 3px, 5px 5px;
          background-position: 0 0, 14px 18px;
          opacity: 0.18;
          mix-blend-mode: screen;
        }

        @keyframes auroraDrift {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          100% { transform: translate3d(20px, -30px, 0) scale(1.1); }
        }
      `}</style>
    </>
  );
};

export default ContactClient;
