import { Resend } from "resend";
import { NextResponse } from "next/server";

/** Shared org Resend account: free tier allows one verified sending domain (codeyourreality.com). */
const DEFAULT_FROM_EMAIL = "noreply@codeyourreality.com";

const APP_LABEL = "LoA (Law of Attraction)";

function parseRecipientList(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function resendErrorMessage(error) {
  if (!error) return "";
  const msg = error.message;
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  if (Array.isArray(msg)) {
    return msg
      .map((m) => {
        if (typeof m === "string") return m;
        if (m?.message) {
          const p = m.path;
          const pathStr = Array.isArray(p) ? p.join(".") : p != null ? String(p) : "";
          return pathStr ? `${pathStr}: ${m.message}` : m.message;
        }
        return "";
      })
      .filter(Boolean)
      .join("; ");
  }
  if (msg && typeof msg === "object") {
    try {
      return JSON.stringify(msg);
    } catch {
      return String(msg);
    }
  }
  if (error.name && typeof error.name === "string") return error.name;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export async function POST(request) {
  // Include Resend `detail` in JSON in next dev or when CONTACT_FORM_VERBOSE_ERRORS is set.
  const verbose =
    process.env.NODE_ENV === "development" ||
    process.env.CONTACT_FORM_VERBOSE_ERRORS === "1" ||
    process.env.CONTACT_FORM_VERBOSE_ERRORS === "true";

  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const contactRaw = process.env.CONTACT_EMAIL?.trim();
    const recipients = parseRecipientList(contactRaw);
    const fromEmail =
      process.env.FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;

    if (!apiKey || recipients.length === 0) {
      console.error("Contact API: set RESEND_API_KEY and CONTACT_EMAIL");
      return NextResponse.json({ error: "Failed to send message" }, { status: 503 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, email, phone, comment, areaOfInterest } = body || {};

    if (typeof name !== "string" || typeof email !== "string") {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const resend = new Resend(apiKey);

    const interests = Object.entries(areaOfInterest || {})
      .filter(([, checked]) => checked)
      .map(([key]) => {
        const labels = {
          loaUsage: "LoA Usage",
          adsSponsorship: "Ads Sponsorship",
          partnership: "Partnership",
          others: "Others",
        };
        return labels[key] || key;
      });

    const to =
      recipients.length === 1 ? recipients[0] : recipients;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      replyTo: trimmedEmail,
      subject: `[LoA] New contact from ${trimmedName}`,
      text: [
        `App: ${APP_LABEL}`,
        ``,
        `Name: ${trimmedName}`,
        `Email: ${trimmedEmail}`,
        `Phone: ${phone || "—"}`,
        `Area of Concern: ${interests.length ? interests.join(", ") : "—"}`,
        ``,
        `Message:`,
        comment || "—",
      ].join("\n"),
    });

    if (error) {
      const msg = resendErrorMessage(error);
      console.error("Contact Resend error:", error?.name, msg, error?.statusCode);
      const payload = { error: "Failed to send message" };
      if (verbose) {
        payload.detail = msg || error?.name || "unknown";
      }
      return NextResponse.json(payload, { status: 502 });
    }

    const messageId = data?.id;
    if (!messageId) {
      console.error("Contact email: missing id in Resend response", data);
      return NextResponse.json({ error: "Failed to send message" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact email error:", error);
    const payload = { error: "Failed to send message" };
    if (verbose && error instanceof Error) {
      payload.detail = error.message;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}
