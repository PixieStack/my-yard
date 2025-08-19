-- Fix missing foreign key relationships in the database schema
-- This will resolve the "Could not find relationship" errors in Supabase queries

-- Add proper foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Check and add foreign key for applications.tenant_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'applications_tenant_id_fkey' 
        AND table_name = 'applications'
    ) THEN
        ALTER TABLE applications 
        ADD CONSTRAINT applications_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Check and add foreign key for applications.property_id -> properties.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'applications_property_id_fkey' 
        AND table_name = 'applications'
    ) THEN
        ALTER TABLE applications 
        ADD CONSTRAINT applications_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
    END IF;

    -- Check and add foreign key for viewing_requests.tenant_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'viewing_requests_tenant_id_fkey' 
        AND table_name = 'viewing_requests'
    ) THEN
        ALTER TABLE viewing_requests 
        ADD CONSTRAINT viewing_requests_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Check and add foreign key for viewing_requests.property_id -> properties.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'viewing_requests_property_id_fkey' 
        AND table_name = 'viewing_requests'
    ) THEN
        ALTER TABLE viewing_requests 
        ADD CONSTRAINT viewing_requests_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
    END IF;

    -- Add relationship between applications and viewing_requests
    -- Since there's no direct FK, we'll create a view or handle it in queries
    
END $$;

-- Refresh the schema cache to recognize new relationships
NOTIFY pgrst, 'reload schema';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_tenant_id ON applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_property_id ON applications(property_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_tenant_id ON viewing_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_property_id ON viewing_requests(property_id);

-- Create a view to easily join applications with viewing requests
CREATE OR REPLACE VIEW application_viewing_requests AS
SELECT 
    a.*,
    vr.id as viewing_request_id,
    vr.requested_date,
    vr.requested_time,
    vr.status as viewing_status,
    vr.tenant_message,
    vr.landlord_response
FROM applications a
LEFT JOIN viewing_requests vr ON (a.property_id = vr.property_id AND a.tenant_id = vr.tenant_id);
