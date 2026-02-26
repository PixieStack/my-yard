-- Migration: Add location columns to properties table
-- This migration adds location_name, location_city, location_province columns
-- and makes township_id optional (for backward compatibility)

-- Step 1: Add new location columns if they don't exist
DO $$ 
BEGIN
    -- Add location_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'location_name') THEN
        ALTER TABLE properties ADD COLUMN location_name VARCHAR(255);
    END IF;

    -- Add location_city column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'location_city') THEN
        ALTER TABLE properties ADD COLUMN location_city VARCHAR(255);
    END IF;

    -- Add location_province column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'location_province') THEN
        ALTER TABLE properties ADD COLUMN location_province VARCHAR(100);
    END IF;
END $$;

-- Step 2: Migrate existing data from townships table (if township_id exists)
UPDATE properties p
SET 
    location_name = t.name,
    location_city = t.city,
    location_province = t.province
FROM townships t
WHERE p.township_id = t.id
  AND p.location_name IS NULL
  AND p.township_id IS NOT NULL;

-- Step 3: Make township_id nullable (if it's currently NOT NULL)
DO $$
BEGIN
    -- Check if township_id exists and alter if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'properties' AND column_name = 'township_id') THEN
        ALTER TABLE properties ALTER COLUMN township_id DROP NOT NULL;
    END IF;
EXCEPTION WHEN others THEN
    -- Column might already be nullable or not exist
    NULL;
END $$;

-- Step 4: Add index on location columns for better search performance
CREATE INDEX IF NOT EXISTS idx_properties_location_name ON properties(location_name);
CREATE INDEX IF NOT EXISTS idx_properties_location_city ON properties(location_city);
CREATE INDEX IF NOT EXISTS idx_properties_location_province ON properties(location_province);

-- Step 5: Add composite index for location searches
CREATE INDEX IF NOT EXISTS idx_properties_location_full 
ON properties(location_province, location_city, location_name);

-- Step 6: Update RLS policies for properties table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Landlords can insert own properties" ON properties;
DROP POLICY IF EXISTS "Landlords can update own properties" ON properties;
DROP POLICY IF EXISTS "Anyone can view available properties" ON properties;

-- Create updated policies
CREATE POLICY "Landlords can insert own properties" ON properties
    FOR INSERT
    TO authenticated
    WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Landlords can update own properties" ON properties
    FOR UPDATE
    TO authenticated
    USING (landlord_id = auth.uid());

CREATE POLICY "Anyone can view available properties" ON properties
    FOR SELECT
    USING (
        status = 'available' 
        OR landlord_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'tenant'
        )
    );

-- Step 7: Add check constraint for valid provinces
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_valid_province' 
        AND table_name = 'properties'
    ) THEN
        ALTER TABLE properties ADD CONSTRAINT chk_valid_province 
        CHECK (
            location_province IS NULL OR
            location_province IN (
                'Gauteng', 
                'KwaZulu-Natal', 
                'Western Cape', 
                'Eastern Cape', 
                'Free State', 
                'Limpopo', 
                'Mpumalanga', 
                'North West', 
                'Northern Cape'
            )
        );
    END IF;
EXCEPTION WHEN others THEN
    -- Constraint might already exist
    NULL;
END $$;

-- Verification query (run this to check the migration worked)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'properties' 
-- AND column_name IN ('location_name', 'location_city', 'location_province', 'township_id');
