-- Fix Database Schema and Relationships
-- This script addresses foreign key relationship issues and missing constraints

-- First, let's ensure we have proper foreign key relationships
-- The main issue is that some tables reference tenant_profiles.id but should reference profiles.id

-- Fix applications table - it should reference profiles.id for tenant_id, not tenant_profiles.id
-- But first check if we need to update existing data
DO $$
BEGIN
    -- Check if applications.tenant_id references tenant_profiles or profiles
    -- Update applications to reference profiles.id instead of tenant_profiles.id if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%applications_tenant_id%' 
        AND table_name = 'applications'
    ) THEN
        -- Drop existing foreign key constraint
        ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_tenant_id_fkey;
    END IF;
    
    -- Add correct foreign key constraint
    ALTER TABLE applications 
    ADD CONSTRAINT applications_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
END $$;

-- Fix viewing_requests table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%viewing_requests_tenant_id%' 
        AND table_name = 'viewing_requests'
    ) THEN
        ALTER TABLE viewing_requests DROP CONSTRAINT IF EXISTS viewing_requests_tenant_id_fkey;
    END IF;
    
    ALTER TABLE viewing_requests 
    ADD CONSTRAINT viewing_requests_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
END $$;

-- Fix leases table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%leases_tenant_id%' 
        AND table_name = 'leases'
    ) THEN
        ALTER TABLE leases DROP CONSTRAINT IF EXISTS leases_tenant_id_fkey;
    END IF;
    
    ALTER TABLE leases 
    ADD CONSTRAINT leases_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
END $$;

-- Fix payments table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%payments_tenant_id%' 
        AND table_name = 'payments'
    ) THEN
        ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_tenant_id_fkey;
    END IF;
    
    ALTER TABLE payments 
    ADD CONSTRAINT payments_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
END $$;

-- Fix maintenance_requests table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%maintenance_requests_tenant_id%' 
        AND table_name = 'maintenance_requests'
    ) THEN
        ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_tenant_id_fkey;
    END IF;
    
    ALTER TABLE maintenance_requests 
    ADD CONSTRAINT maintenance_requests_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
END $$;

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_tenant_id ON applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_property_id ON applications(property_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_landlord_id ON leases(landlord_id);
CREATE INDEX IF NOT EXISTS idx_leases_is_active ON leases(is_active);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_landlord_id ON payments(landlord_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);

-- Ensure all enum types exist
DO $$
BEGIN
    -- Create application_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM ('pending', 'viewing_requested', 'approved', 'rejected');
    END IF;
    
    -- Create payment_status enum if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'partial');
    END IF;
    
    -- Create payment_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
        CREATE TYPE payment_type AS ENUM ('rent', 'deposit', 'utilities', 'maintenance', 'other');
    END IF;
    
    -- Create viewing_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'viewing_status') THEN
        CREATE TYPE viewing_status AS ENUM ('requested', 'confirmed', 'completed', 'cancelled', 'rescheduled');
    END IF;
END $$;

-- Add any missing columns that might be needed
ALTER TABLE applications ADD COLUMN IF NOT EXISTS viewing_status viewing_status DEFAULT 'requested';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Update any existing data to ensure consistency
UPDATE applications SET status = 'pending' WHERE status IS NULL;
UPDATE payments SET status = 'pending' WHERE status IS NULL;

-- Add constraints to ensure data integrity
ALTER TABLE applications ADD CONSTRAINT IF NOT EXISTS check_lease_duration 
    CHECK (lease_duration_requested > 0 AND lease_duration_requested <= 60);
    
ALTER TABLE payments ADD CONSTRAINT IF NOT EXISTS check_positive_amount 
    CHECK (amount > 0);

COMMIT;
