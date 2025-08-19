-- Fix all foreign key relationships and constraints
-- This script establishes proper relationships between tables

-- First, ensure all foreign key constraints exist
DO $$ 
BEGIN
    -- Add foreign key for applications.tenant_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'applications_tenant_id_fkey'
    ) THEN
        ALTER TABLE applications 
        ADD CONSTRAINT applications_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for applications.property_id -> properties.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'applications_property_id_fkey'
    ) THEN
        ALTER TABLE applications 
        ADD CONSTRAINT applications_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for leases.tenant_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leases_tenant_id_fkey'
    ) THEN
        ALTER TABLE leases 
        ADD CONSTRAINT leases_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for leases.landlord_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leases_landlord_id_fkey'
    ) THEN
        ALTER TABLE leases 
        ADD CONSTRAINT leases_landlord_id_fkey 
        FOREIGN KEY (landlord_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for leases.property_id -> properties.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leases_property_id_fkey'
    ) THEN
        ALTER TABLE leases 
        ADD CONSTRAINT leases_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for messages.sender_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_sender_id_fkey'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for messages.recipient_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_recipient_id_fkey'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_recipient_id_fkey 
        FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for viewing_requests.tenant_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'viewing_requests_tenant_id_fkey'
    ) THEN
        ALTER TABLE viewing_requests 
        ADD CONSTRAINT viewing_requests_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for viewing_requests.property_id -> properties.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'viewing_requests_property_id_fkey'
    ) THEN
        ALTER TABLE viewing_requests 
        ADD CONSTRAINT viewing_requests_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for payments.tenant_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payments_tenant_id_fkey'
    ) THEN
        ALTER TABLE payments 
        ADD CONSTRAINT payments_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for payments.landlord_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payments_landlord_id_fkey'
    ) THEN
        ALTER TABLE payments 
        ADD CONSTRAINT payments_landlord_id_fkey 
        FOREIGN KEY (landlord_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_tenant_id ON applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_property_id ON applications(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_landlord_id ON leases(landlord_id);
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_tenant_id ON viewing_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_property_id ON viewing_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_landlord_id ON payments(landlord_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
