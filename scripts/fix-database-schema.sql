-- Creating a new comprehensive schema fix script with proper foreign key relationships
-- Comprehensive schema fix for MyYard application
-- This script creates all missing foreign key relationships and indexes

-- Drop existing foreign keys if they exist to avoid conflicts
DO $$ 
BEGIN
    -- Drop existing foreign keys if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'applications_tenant_id_fkey') THEN
        ALTER TABLE applications DROP CONSTRAINT applications_tenant_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'applications_property_id_fkey') THEN
        ALTER TABLE applications DROP CONSTRAINT applications_property_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leases_tenant_id_fkey') THEN
        ALTER TABLE leases DROP CONSTRAINT leases_tenant_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leases_property_id_fkey') THEN
        ALTER TABLE leases DROP CONSTRAINT leases_property_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leases_landlord_id_fkey') THEN
        ALTER TABLE leases DROP CONSTRAINT leases_landlord_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'properties_landlord_id_fkey') THEN
        ALTER TABLE properties DROP CONSTRAINT properties_landlord_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_sender_id_fkey') THEN
        ALTER TABLE messages DROP CONSTRAINT messages_sender_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_recipient_id_fkey') THEN
        ALTER TABLE messages DROP CONSTRAINT messages_recipient_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'viewing_requests_property_id_fkey') THEN
        ALTER TABLE viewing_requests DROP CONSTRAINT viewing_requests_property_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'viewing_requests_tenant_id_fkey') THEN
        ALTER TABLE viewing_requests DROP CONSTRAINT viewing_requests_tenant_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payments_lease_id_fkey') THEN
        ALTER TABLE payments DROP CONSTRAINT payments_lease_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payments_tenant_id_fkey') THEN
        ALTER TABLE payments DROP CONSTRAINT payments_tenant_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payments_landlord_id_fkey') THEN
        ALTER TABLE payments DROP CONSTRAINT payments_landlord_id_fkey;
    END IF;
END $$;

-- Create all necessary foreign key relationships
-- Applications table relationships
ALTER TABLE applications 
ADD CONSTRAINT applications_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE applications 
ADD CONSTRAINT applications_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- Leases table relationships
ALTER TABLE leases 
ADD CONSTRAINT leases_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE leases 
ADD CONSTRAINT leases_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE leases 
ADD CONSTRAINT leases_landlord_id_fkey 
FOREIGN KEY (landlord_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Properties table relationships
ALTER TABLE properties 
ADD CONSTRAINT properties_landlord_id_fkey 
FOREIGN KEY (landlord_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Messages table relationships
ALTER TABLE messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT messages_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Viewing requests table relationships
ALTER TABLE viewing_requests 
ADD CONSTRAINT viewing_requests_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE viewing_requests 
ADD CONSTRAINT viewing_requests_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Payments table relationships
ALTER TABLE payments 
ADD CONSTRAINT payments_lease_id_fkey 
FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE;

ALTER TABLE payments 
ADD CONSTRAINT payments_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE payments 
ADD CONSTRAINT payments_landlord_id_fkey 
FOREIGN KEY (landlord_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_tenant_id ON applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_property_id ON applications(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_landlord_id ON leases(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_property_id ON viewing_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_tenant_id ON viewing_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_lease_id ON payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_landlord_id ON payments(landlord_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
