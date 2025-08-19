-- Complete viewing workflow database updates
-- This script ensures all viewing workflow functionality works properly

-- First, ensure we have the correct enum values for viewing_status
DO $$ 
BEGIN
    -- Check if viewing_status type exists and update it
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'viewing_status') THEN
        -- Add missing enum values if they don't exist
        BEGIN
            ALTER TYPE viewing_status ADD VALUE IF NOT EXISTS 'viewing_accepted';
        EXCEPTION WHEN duplicate_object THEN
            -- Value already exists, continue
        END;
        
        BEGIN
            ALTER TYPE viewing_status ADD VALUE IF NOT EXISTS 'awaiting_landlord_decision';
        EXCEPTION WHEN duplicate_object THEN
            -- Value already exists, continue
        END;
    ELSE
        -- Create the enum type if it doesn't exist
        CREATE TYPE viewing_status AS ENUM (
            'requested', 
            'confirmed', 
            'viewing_accepted',
            'declined', 
            'awaiting_landlord_decision',
            'completed', 
            'cancelled'
        );
    END IF;
END $$;

-- Ensure application_status enum has all required values
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        -- Add missing enum values if they don't exist
        BEGIN
            ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'viewing_accepted';
        EXCEPTION WHEN duplicate_object THEN
            -- Value already exists, continue
        END;
        
        BEGIN
            ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'awaiting_landlord_decision';
        EXCEPTION WHEN duplicate_object THEN
            -- Value already exists, continue
        END;
    END IF;
END $$;

-- Update viewing_requests table to ensure proper structure
DO $$
BEGIN
    -- Add decline_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'viewing_requests' AND column_name = 'decline_reason') THEN
        ALTER TABLE viewing_requests ADD COLUMN decline_reason TEXT;
    END IF;
    
    -- Add willing_without_viewing column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'viewing_requests' AND column_name = 'willing_without_viewing') THEN
        ALTER TABLE viewing_requests ADD COLUMN willing_without_viewing BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create or replace function to handle viewing workflow notifications
CREATE OR REPLACE FUNCTION handle_viewing_workflow_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- When viewing status changes to awaiting_landlord_decision, notify landlord
    IF NEW.status = 'awaiting_landlord_decision' AND OLD.status != 'awaiting_landlord_decision' THEN
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            action_url
        )
        SELECT 
            p.landlord_id,
            'Tenant Willing to Proceed Without Viewing',
            'A tenant has declined the viewing but is willing to take the apartment without viewing it.',
            'application',
            '/landlord/applications'
        FROM properties p
        WHERE p.id = NEW.property_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for viewing workflow notifications
DROP TRIGGER IF EXISTS viewing_workflow_notification_trigger ON viewing_requests;
CREATE TRIGGER viewing_workflow_notification_trigger
    AFTER UPDATE ON viewing_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_viewing_workflow_notification();

-- Ensure RLS policies are correct for viewing_requests
DROP POLICY IF EXISTS "Landlords can manage viewing requests for their properties" ON viewing_requests;
CREATE POLICY "Landlords can manage viewing requests for their properties" ON viewing_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = viewing_requests.property_id 
            AND properties.landlord_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tenants can view and update their own viewing requests" ON viewing_requests;
CREATE POLICY "Tenants can view and update their own viewing requests" ON viewing_requests
    FOR ALL USING (tenant_id = auth.uid());

-- Update messages table to ensure proper foreign key relationships
DO $$
BEGIN
    -- Ensure property_id foreign key exists and is correct
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_property_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for better performance on viewing requests
CREATE INDEX IF NOT EXISTS idx_viewing_requests_property_tenant 
ON viewing_requests(property_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_viewing_requests_status 
ON viewing_requests(status);

-- Create index for better performance on messages
CREATE INDEX IF NOT EXISTS idx_messages_property_type 
ON messages(property_id, message_type);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_read 
ON messages(recipient_id, is_read);
