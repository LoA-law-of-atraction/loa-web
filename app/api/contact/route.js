import { Resend } from "resend";
import { NextResponse } from "next/server";

/** Shared org Resend account: free tier allows one verified sending domain (codeyourreality.com). */
const DEFAULT_FROM_EMAIL = "noreply@codeyourreality.com";

const APP_LABEL = "LoA (Law of Attraction)";

export async function POST(request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const contactEmail = process.env.CONTACT_EMAIL?.trim();
    const fromEmail =
      process.env.FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;

    if (!apiKey || !contactEmail) {
      console.error("Contact API: set RESEND_API_KEY and CONTACT_EMAIL");
      return NextResponse.json({ error: "Failed to send message" }, { status: 503 });
    }

    const resend = new Resend(apiKey);

    const { name, email, phone, comment, areaOfInterest } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

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

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: contactEmail,
      replyTo: email,
      subject: `[LoA] New contact from ${name}`,
      text: [
        `App: ${APP_LABEL}`,
        ``,
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || "—"}`,
        `Area of Concern: ${interests.length ? interests.join(", ") : "—"}`,
        ``,
        `Message:`,
        comment || "—",
      ].join("\n"),
    });

    if (error) {
      console.error("Contact email error:", error);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    if (!data?.id) {
      console.error("Contact email error: missing message id in Resend response", data);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact email error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
