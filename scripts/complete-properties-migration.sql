-- ============================================
-- MYYARD PROPERTIES TABLE - COMPLETE MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Add ALL potentially missing columns to properties table
DO $$ 
BEGIN
    -- Location columns (new approach - no foreign key dependency)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'location_name') THEN
        ALTER TABLE properties ADD COLUMN location_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'location_city') THEN
        ALTER TABLE properties ADD COLUMN location_city VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'location_province') THEN
        ALTER TABLE properties ADD COLUMN location_province VARCHAR(100);
    END IF;

    -- Basic property details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bedrooms') THEN
        ALTER TABLE properties ADD COLUMN bedrooms INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bathrooms') THEN
        ALTER TABLE properties ADD COLUMN bathrooms INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'square_meters') THEN
        ALTER TABLE properties ADD COLUMN square_meters INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'parking_spaces') THEN
        ALTER TABLE properties ADD COLUMN parking_spaces INTEGER DEFAULT 0;
    END IF;

    -- Boolean feature flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'is_furnished') THEN
        ALTER TABLE properties ADD COLUMN is_furnished BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'pets_allowed') THEN
        ALTER TABLE properties ADD COLUMN pets_allowed BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'smoking_allowed') THEN
        ALTER TABLE properties ADD COLUMN smoking_allowed BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'garden_access') THEN
        ALTER TABLE properties ADD COLUMN garden_access BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'wifi_included') THEN
        ALTER TABLE properties ADD COLUMN wifi_included BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'electricity_included') THEN
        ALTER TABLE properties ADD COLUMN electricity_included BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'water_included') THEN
        ALTER TABLE properties ADD COLUMN water_included BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'gas_included') THEN
        ALTER TABLE properties ADD COLUMN gas_included BOOLEAN DEFAULT false;
    END IF;

    -- Availability and lease terms
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'available_from') THEN
        ALTER TABLE properties ADD COLUMN available_from DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'lease_duration_months') THEN
        ALTER TABLE properties ADD COLUMN lease_duration_months INTEGER DEFAULT 12;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'minimum_lease_months') THEN
        ALTER TABLE properties ADD COLUMN minimum_lease_months INTEGER DEFAULT 6;
    END IF;

    -- Status fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'is_active') THEN
        ALTER TABLE properties ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'status') THEN
        ALTER TABLE properties ADD COLUMN status VARCHAR(50) DEFAULT 'available';
    END IF;

    -- Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'created_at') THEN
        ALTER TABLE properties ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'updated_at') THEN
        ALTER TABLE properties ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

END $$;

-- Step 2: Make township_id nullable (if it exists and is NOT NULL)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'township_id') THEN
        ALTER TABLE properties ALTER COLUMN township_id DROP NOT NULL;
    END IF;
EXCEPTION WHEN others THEN
    NULL; -- Column might already be nullable
END $$;

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_location_name ON properties(location_name);
CREATE INDEX IF NOT EXISTS idx_properties_location_city ON properties(location_city);
CREATE INDEX IF NOT EXISTS idx_properties_location_province ON properties(location_province);
CREATE INDEX IF NOT EXISTS idx_properties_rent_amount ON properties(rent_amount);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);

-- Step 4: Enable RLS on properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies (if any) and recreate
DROP POLICY IF EXISTS "Anyone can view available properties" ON properties;
DROP POLICY IF EXISTS "Landlords can insert own properties" ON properties;
DROP POLICY IF EXISTS "Landlords can update own properties" ON properties;
DROP POLICY IF EXISTS "Landlords can delete own properties" ON properties;

-- Allow anyone to view available properties
CREATE POLICY "Anyone can view available properties" ON properties
    FOR SELECT
    USING (
        status = 'available' 
        OR landlord_id = auth.uid()
    );

-- Allow landlords to insert their own properties
CREATE POLICY "Landlords can insert own properties" ON properties
    FOR INSERT
    TO authenticated
    WITH CHECK (landlord_id = auth.uid());

-- Allow landlords to update their own properties
CREATE POLICY "Landlords can update own properties" ON properties
    FOR UPDATE
    TO authenticated
    USING (landlord_id = auth.uid());

-- Allow landlords to delete their own properties
CREATE POLICY "Landlords can delete own properties" ON properties
    FOR DELETE
    TO authenticated
    USING (landlord_id = auth.uid());

-- Step 6: Create property_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS property_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    caption TEXT,
    image_type VARCHAR(50) DEFAULT 'property',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on property_images
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on property_images
DROP POLICY IF EXISTS "Anyone can view property images" ON property_images;
DROP POLICY IF EXISTS "Landlords can insert property images" ON property_images;
DROP POLICY IF EXISTS "Landlords can update property images" ON property_images;
DROP POLICY IF EXISTS "Landlords can delete property images" ON property_images;

-- Create policies for property_images
CREATE POLICY "Anyone can view property images" ON property_images
    FOR SELECT
    USING (true);

CREATE POLICY "Landlords can insert property images" ON property_images
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_images.property_id 
            AND properties.landlord_id = auth.uid()
        )
    );

CREATE POLICY "Landlords can update property images" ON property_images
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_images.property_id 
            AND properties.landlord_id = auth.uid()
        )
    );

CREATE POLICY "Landlords can delete property images" ON property_images
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_images.property_id 
            AND properties.landlord_id = auth.uid()
        )
    );

-- Step 7: Create property_amenities table if it doesn't exist
CREATE TABLE IF NOT EXISTS property_amenities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    amenity_category VARCHAR(100),
    amenity_name VARCHAR(255) NOT NULL,
    amenity_description TEXT,
    is_included_in_rent BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on property_amenities
ALTER TABLE property_amenities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on property_amenities
DROP POLICY IF EXISTS "Anyone can view property amenities" ON property_amenities;
DROP POLICY IF EXISTS "Landlords can manage property amenities" ON property_amenities;

-- Create policies for property_amenities
CREATE POLICY "Anyone can view property amenities" ON property_amenities
    FOR SELECT
    USING (true);

CREATE POLICY "Landlords can manage property amenities" ON property_amenities
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_amenities.property_id 
            AND properties.landlord_id = auth.uid()
        )
    );

-- Step 8: Create storage bucket for property images (run this separately if needed)
-- Note: Storage bucket creation may need to be done via Supabase Dashboard or API

-- ============================================
-- VERIFICATION QUERY - Run this to check the migration worked
-- ============================================
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'properties'
-- ORDER BY ordinal_position;
