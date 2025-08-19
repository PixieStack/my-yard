-- Add missing enum values for viewing_status
DO $$ 
BEGIN
    -- Add 'accepted' to viewing_status enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'accepted' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'viewing_status')
    ) THEN
        ALTER TYPE viewing_status ADD VALUE 'accepted';
    END IF;
    
    -- Add 'declined' to viewing_status enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'declined' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'viewing_status')
    ) THEN
        ALTER TYPE viewing_status ADD VALUE 'declined';
    END IF;
END $$;

-- Fix foreign key references in viewing_requests table
DO $$
BEGIN
    -- Drop the incorrect foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'viewing_requests_tenant_id_fkey' 
        AND table_name = 'viewing_requests'
    ) THEN
        ALTER TABLE viewing_requests DROP CONSTRAINT viewing_requests_tenant_id_fkey;
    END IF;
    
    -- Add the correct foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'viewing_requests_tenant_id_profiles_fkey' 
        AND table_name = 'viewing_requests'
    ) THEN
        ALTER TABLE viewing_requests 
        ADD CONSTRAINT viewing_requests_tenant_id_profiles_fkey 
        FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure applications table references profiles correctly
DO $$
BEGIN
    -- Drop incorrect foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'applications_tenant_id_fkey' 
        AND table_name = 'applications'
    ) THEN
        ALTER TABLE applications DROP CONSTRAINT applications_tenant_id_fkey;
    END IF;
    
    -- Add correct foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'applications_tenant_id_profiles_fkey' 
        AND table_name = 'applications'
    ) THEN
        ALTER TABLE applications 
        ADD CONSTRAINT applications_tenant_id_profiles_fkey 
        FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create function to automatically create lease when application is approved
CREATE OR REPLACE FUNCTION create_lease_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create lease if status changed to 'approved'
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO leases (
            property_id,
            tenant_id,
            landlord_id,
            start_date,
            end_date,
            rent_amount,
            deposit_amount,
            is_active,
            lease_terms
        ) VALUES (
            NEW.property_id,
            NEW.tenant_id,
            (SELECT landlord_id FROM properties WHERE id = NEW.property_id),
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '12 months',
            (SELECT rent_amount FROM properties WHERE id = NEW.property_id),
            (SELECT rent_amount FROM properties WHERE id = NEW.property_id),
            true,
            'Standard 12-month lease agreement'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic lease creation
DROP TRIGGER IF EXISTS trigger_create_lease_on_approval ON applications;
CREATE TRIGGER trigger_create_lease_on_approval
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION create_lease_on_approval();
