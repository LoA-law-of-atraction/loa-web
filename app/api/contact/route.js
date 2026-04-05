import { Resend } from "resend";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Shared org Resend (free tier): one verified domain — codeyourreality.com.
 * If FROM_EMAIL is @loa-lawofattraction.co (or any unverified domain), Resend rejects;
 * we coerce to the verified address (same pattern as deckbase-web).
 */
const VERIFIED_SEND_DOMAIN = "codeyourreality.com";
const DEFAULT_FROM = "noreply@codeyourreality.com";

const APP_LABEL = "LoA (Law of Attraction)";

/** Strip BOM, newlines, quotes, and accidental `Bearer ` prefix (common Vercel / copy-paste issues). */
function normalizeResendApiKey(raw) {
  if (raw == null || typeof raw !== "string") return "";
  let s = raw.replace(/\uFEFF/g, "").trim();
  if (/^Bearer\s+/i.test(s)) s = s.replace(/^Bearer\s+/i, "").trim();
  s = s.replace(/^["']|["']$/g, "");
  s = s.replace(/[\r\n\t]/g, "");
  return s.trim();
}

function extractEmailFromFromField(value) {
  const v = String(value || "").trim();
  const angle = v.match(/<([^>]+)>/);
  return (angle ? angle[1] : v).trim();
}

function isOnVerifiedSendDomain(emailAddr) {
  const host = emailAddr.split("@")[1]?.toLowerCase();
  if (!host) return false;
  return (
    host === VERIFIED_SEND_DOMAIN || host.endsWith(`.${VERIFIED_SEND_DOMAIN}`)
  );
}

/** Resend `from`: must be @VERIFIED_SEND_DOMAIN; env FROM_EMAIL only used when it matches. */
function resolveResendFrom() {
  const raw = (process.env.FROM_EMAIL || DEFAULT_FROM).trim();
  const addr = extractEmailFromFromField(raw);
  if (isOnVerifiedSendDomain(addr)) {
    return raw.includes("<") ? raw : `LoA <${addr}>`;
  }
  console.warn(
    `[contact] FROM_EMAIL must be @${VERIFIED_SEND_DOMAIN} (org Resend). Got "${raw}". Using ${DEFAULT_FROM}.`
  );
  return `LoA <${DEFAULT_FROM}>`;
}

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
    const apiKey = normalizeResendApiKey(process.env.RESEND_API_KEY);
    const contactRaw = process.env.CONTACT_EMAIL?.trim();
    const recipients = parseRecipientList(contactRaw);

    if (!apiKey) {
      console.error("Contact email: RESEND_API_KEY is not set");
      const payload = {
        error: "Failed to send message",
        code: "config_error",
      };
      if (verbose) {
        payload.detail = "RESEND_API_KEY is missing";
      }
      return NextResponse.json(payload, { status: 503 });
    }
    if (!/^re_[^\s]+$/.test(apiKey)) {
      console.error(
        "Contact email: RESEND_API_KEY does not look like a Resend key (expected re_…). Check for typos, wrong env file, or Preview vs Production on Vercel."
      );
    }
    if (recipients.length === 0) {
      console.error("Contact API: CONTACT_EMAIL is not set or empty");
      const payload = {
        error: "Failed to send message",
        code: "config_error",
      };
      if (verbose) {
        payload.detail = "CONTACT_EMAIL is missing";
      }
      return NextResponse.json(payload, { status: 503 });
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

    const from = resolveResendFrom();
    const { data, error } = await resend.emails.send({
      from: from.trim(),
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
      const authFailed =
        error?.statusCode === 401 ||
        /api key|unauthorized|invalid.*key/i.test(String(msg));
      if (authFailed) {
        console.error(
          "Contact Resend: authentication failed. Confirm RESEND_API_KEY in this environment (Vercel: Settings → Environment Variables → Production), redeploy after changes, and that the key is active at https://resend.com/api-keys — local dev uses .env / .env.local only (not .env.prod unless you load it)."
        );
      }
      const payload = {
        error: "Failed to send message",
        ...(error?.name ? { code: error.name } : {}),
      };
      if (verbose) {
        payload.detail = msg || error?.name || "unknown";
      }
      return NextResponse.json(payload, { status: 502 });
    }

    const messageId = data?.id ?? data?.data?.id;
    if (!messageId) {
      console.error("Contact email: missing id in Resend response", data);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: messageId });
  } catch (error) {
    console.error("Contact email error:", error);
    const payload = { error: "Failed to send message" };
    if (verbose && error instanceof Error) {
      payload.detail = error.message;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}
