import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// Valid property types
const VALID_PROPERTY_TYPES = ["room", "bachelor", "cottage"] as const
type PropertyType = (typeof VALID_PROPERTY_TYPES)[number]

// Valid provinces
const VALID_PROVINCES = [
  "Gauteng",
  "KwaZulu-Natal",
  "Western Cape",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
] as const

interface CreatePropertyRequest {
  title: string
  description?: string
  property_type: PropertyType
  rent_amount: number
  deposit_amount?: number | null
  bedrooms: number
  bathrooms: number
  square_meters?: number | null
  address: string
  location_name: string
  location_city: string
  location_province: string
  is_furnished?: boolean
  pets_allowed?: boolean
  smoking_allowed?: boolean
  parking_spaces?: number
  garden_access?: boolean
  wifi_included?: boolean
  electricity_included?: boolean
  water_included?: boolean
  gas_included?: boolean
  available_from?: string | null
  lease_duration_months?: number
  minimum_lease_months?: number
}

// Server-side validation
function validatePropertyData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!data.title?.trim()) {
    errors.push("Property title is required")
  } else if (data.title.length > 200) {
    errors.push("Property title must be less than 200 characters")
  }

  if (!data.property_type || !VALID_PROPERTY_TYPES.includes(data.property_type)) {
    errors.push("Invalid property type. Must be: room, bachelor, or cottage")
  }

  if (!data.rent_amount || typeof data.rent_amount !== "number" || data.rent_amount <= 0) {
    errors.push("Rent amount must be a positive number")
  } else if (data.rent_amount > 1000000) {
    errors.push("Rent amount seems unreasonably high")
  }

  if (data.deposit_amount !== null && data.deposit_amount !== undefined) {
    if (typeof data.deposit_amount !== "number" || data.deposit_amount < 0) {
      errors.push("Deposit amount must be a non-negative number")
    }
  }

  if (!data.address?.trim()) {
    errors.push("Street address is required")
  } else if (data.address.length > 500) {
    errors.push("Street address is too long")
  }

  // Location validation
  if (!data.location_name?.trim()) {
    errors.push("Location name is required")
  }
  if (!data.location_city?.trim()) {
    errors.push("Location city is required")
  }
  if (!data.location_province || !VALID_PROVINCES.includes(data.location_province)) {
    errors.push("Invalid province")
  }

  // Numeric field validation
  if (data.bedrooms !== undefined && (typeof data.bedrooms !== "number" || data.bedrooms < 0 || data.bedrooms > 20)) {
    errors.push("Bedrooms must be between 0 and 20")
  }

  if (data.bathrooms !== undefined && (typeof data.bathrooms !== "number" || data.bathrooms < 0 || data.bathrooms > 10)) {
    errors.push("Bathrooms must be between 0 and 10")
  }

  if (data.square_meters !== null && data.square_meters !== undefined) {
    if (typeof data.square_meters !== "number" || data.square_meters < 1 || data.square_meters > 10000) {
      errors.push("Square meters must be between 1 and 10000")
    }
  }

  if (data.parking_spaces !== undefined && (typeof data.parking_spaces !== "number" || data.parking_spaces < 0 || data.parking_spaces > 10)) {
    errors.push("Parking spaces must be between 0 and 10")
  }

  // Date validation
  if (data.available_from) {
    const availableDate = new Date(data.available_from)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (isNaN(availableDate.getTime())) {
      errors.push("Invalid available from date format")
    } else if (availableDate < today) {
      errors.push("Available from date cannot be in the past")
    }
  }

  // Lease duration validation
  if (data.lease_duration_months !== undefined && data.minimum_lease_months !== undefined) {
    if (data.minimum_lease_months > data.lease_duration_months) {
      errors.push("Minimum lease duration cannot exceed preferred lease duration")
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized - please log in" }, { status: 401 })
    }

    // Get user profile to verify landlord role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    if (profile.role !== "landlord") {
      return NextResponse.json({ error: "Only landlords can create properties" }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()

    // Server-side validation
    const validation = validatePropertyData(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      )
    }

    // Prepare property data
    const propertyData = {
      landlord_id: profile.id,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      property_type: body.property_type,
      rent_amount: body.rent_amount,
      deposit_amount: body.deposit_amount || null,
      bedrooms: body.bedrooms || 1,
      bathrooms: body.bathrooms || 1,
      square_meters: body.square_meters || null,
      address: body.address.trim(),
      location_name: body.location_name.trim(),
      location_city: body.location_city.trim(),
      location_province: body.location_province,
      is_furnished: body.is_furnished || false,
      pets_allowed: body.pets_allowed || false,
      smoking_allowed: body.smoking_allowed || false,
      parking_spaces: body.parking_spaces || 0,
      garden_access: body.garden_access || false,
      wifi_included: body.wifi_included || false,
      electricity_included: body.electricity_included || false,
      water_included: body.water_included || false,
      gas_included: body.gas_included || false,
      available_from: body.available_from || null,
      lease_duration_months: body.lease_duration_months || 12,
      minimum_lease_months: body.minimum_lease_months || 6,
      status: "available",
      is_active: true,
    }

    // Insert property
    const { data: property, error: insertError } = await supabase
      .from("properties")
      .insert(propertyData)
      .select("id")
      .single()

    if (insertError) {
      console.error("Property insert error:", insertError)
      return NextResponse.json(
        { error: `Failed to create property: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        property_id: property.id,
        message: "Property created successfully",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Property creation error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint to list properties for the authenticated landlord
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "available"

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Query properties for this landlord
    let query = supabase
      .from("properties")
      .select(
        `
        id,
        title,
        description,
        property_type,
        rent_amount,
        deposit_amount,
        bedrooms,
        bathrooms,
        address,
        location_name,
        location_city,
        location_province,
        status,
        is_active,
        created_at,
        updated_at
      `
      )
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false })

    if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data: properties, error: queryError } = await query

    if (queryError) {
      console.error("Properties query error:", queryError)
      return NextResponse.json(
        { error: queryError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      properties: properties || [],
      total: (properties || []).length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
