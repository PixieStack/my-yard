import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import crypto from "crypto"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// POST /api/auth/send-verification
// Sends a verification email via Brevo SMTP
export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    // Generate a 6-digit OTP code
    const code = crypto.randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store the verification code (we'll use a simple approach - encode in URL)
    const verificationToken = Buffer.from(
      JSON.stringify({ email, code, expires: expiresAt.toISOString() })
    ).toString("base64url")

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || ""
    const verifyLink = `${appUrl}/auth/verify-email?token=${verificationToken}&code=${code}`

    const fromName = process.env.SMTP_FROM_NAME || "MyYard"
    const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@myyard.co.za"

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: "Verify your MyYard account",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fff7ed; margin: 0; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.1); border: 2px solid #fed7aa;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #ea580c; font-size: 28px; margin: 0;">MyYard</h1>
      <p style="color: #92400e; font-size: 14px; margin-top: 4px;">South Africa's Township Rental Platform</p>
    </div>
    
    <h2 style="color: #1a1a1a; font-size: 22px; text-align: center; margin-bottom: 8px;">Welcome${name ? ', ' + name : ''}!</h2>
    <p style="color: #666; text-align: center; line-height: 1.6;">Verify your email address to complete your registration and start using MyYard.</p>
    
    <div style="background: linear-gradient(135deg, #fff7ed, #fef3c7); border: 2px solid #f97316; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">Your verification code:</p>
      <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ea580c; font-family: monospace;">${code}</div>
      <p style="color: #a16207; font-size: 12px; margin: 8px 0 0 0;">This code expires in 10 minutes</p>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${verifyLink}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #eab308); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">Verify Email Address</a>
    </div>
    
    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #fed7aa; padding-top: 20px;">
      If you didn't create an account on MyYard, please ignore this email.<br/>
      &copy; ${new Date().getFullYear()} MyYard - All Rights Reserved
    </p>
  </div>
</body>
</html>`,
    })

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
    })
  } catch (error: any) {
    console.error("Email send error:", error)
    return NextResponse.json(
      { error: "Failed to send verification email: " + error.message },
      { status: 500 }
    )
  }
}
