import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { name, phone, email, message } = body;

  const whatsappNumber = "919705338571";

  const text = `
📩 New Contact Request

👤 Name: ${name}
📞 Phone: ${phone}
📧 Email: ${email || "Not provided"}

💬 Message:
${message}
`;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    text
  )}`;

  return NextResponse.json({
    success: true,
    redirectUrl: whatsappUrl,
  });
}
