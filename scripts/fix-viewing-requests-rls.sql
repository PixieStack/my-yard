-- Fix RLS policies for viewing_requests table to allow landlords to create viewing requests

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Landlords can insert viewing requests for their properties" ON viewing_requests;
DROP POLICY IF EXISTS "Landlords can view viewing requests for their properties" ON viewing_requests;
DROP POLICY IF EXISTS "Tenants can view their own viewing requests" ON viewing_requests;
DROP POLICY IF EXISTS "Tenants can update their own viewing requests" ON viewing_requests;
DROP POLICY IF EXISTS "Landlords can update viewing requests for their properties" ON viewing_requests;

-- Enable RLS on viewing_requests table
ALTER TABLE viewing_requests ENABLE ROW LEVEL SECURITY;

-- Allow landlords to insert viewing requests for properties they own
CREATE POLICY "Landlords can insert viewing requests for their properties" ON viewing_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = viewing_requests.property_id 
            AND properties.landlord_id = auth.uid()
        )
    );

-- Allow landlords to view viewing requests for their properties
CREATE POLICY "Landlords can view viewing requests for their properties" ON viewing_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = viewing_requests.property_id 
            AND properties.landlord_id = auth.uid()
        )
    );

-- Allow tenants to view their own viewing requests
CREATE POLICY "Tenants can view their own viewing requests" ON viewing_requests
    FOR SELECT USING (tenant_id = auth.uid());

-- Allow tenants to update their own viewing requests (for responding to viewing invitations)
CREATE POLICY "Tenants can update their own viewing requests" ON viewing_requests
    FOR UPDATE USING (tenant_id = auth.uid());

-- Allow landlords to update viewing requests for their properties
CREATE POLICY "Landlords can update viewing requests for their properties" ON viewing_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = viewing_requests.property_id 
            AND properties.landlord_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON viewing_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
