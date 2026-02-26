import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const ozowEnabled = process.env.NEXT_PUBLIC_OZOW_ENABLED === "true"

    if (!ozowEnabled) {
      return NextResponse.json(
        { error: "Ozow payments are not yet configured. Please contact your administrator." },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { amount, reference, tenant_id } = body

    // Ozow API integration placeholder
    // When OZOW_API_KEY is provided, this will:
    // 1. Create a payment request with Ozow
    // 2. Return the redirect URL for the tenant to complete payment
    // 3. Handle the webhook callback for payment confirmation

    const ozowApiKey = process.env.OZOW_API_KEY
    const ozowSiteCode = process.env.OZOW_SITE_CODE

    if (!ozowApiKey || ozowApiKey.startsWith("PLACEHOLDER")) {
      return NextResponse.json(
        { error: "Ozow API key not configured. Payment processing unavailable." },
        { status: 503 }
      )
    }

    // TODO: Implement actual Ozow API call when key is provided
    // Reference: /app/playbook_for_ozow.md
    return NextResponse.json({
      success: false,
      message: "Ozow integration pending API key configuration",
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
