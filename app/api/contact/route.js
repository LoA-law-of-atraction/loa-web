import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const contactEmail = process.env.CONTACT_EMAIL;
    const fromEmail = process.env.FROM_EMAIL;

    if (!apiKey || !contactEmail || !fromEmail) {
      console.error("Contact API: set RESEND_API_KEY, CONTACT_EMAIL, and FROM_EMAIL");
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

    await resend.emails.send({
      from: fromEmail,
      to: contactEmail,
      replyTo: email,
      subject: `New contact from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || "—"}`,
        `Area of Concern: ${interests.length ? interests.join(", ") : "—"}`,
        ``,
        `Message:`,
        comment || "—",
      ].join("\n"),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact email error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
