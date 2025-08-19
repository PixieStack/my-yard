-- Fix Application Workflow Schema and Status Flow
-- This script addresses foreign key issues and improves the application workflow

-- First, update the application_status enum to include all workflow states
DROP TYPE IF EXISTS application_status CASCADE;
CREATE TYPE application_status AS ENUM (
    'pending', 
    'viewing_requested', 
    'viewing_scheduled', 
    'viewing_declined', 
    'approved', 
    'rejected'
);

-- Update viewing_requests table to reference profiles instead of tenant_profiles
-- Drop existing foreign key constraint
ALTER TABLE public.viewing_requests 
DROP CONSTRAINT IF EXISTS viewing_requests_tenant_id_fkey;

-- Add new foreign key constraint to profiles table
ALTER TABLE public.viewing_requests 
ADD CONSTRAINT viewing_requests_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update applications table to reference profiles instead of tenant_profiles
-- Drop existing foreign key constraint
ALTER TABLE public.applications 
DROP CONSTRAINT IF EXISTS applications_tenant_id_fkey;

-- Add new foreign key constraint to profiles table
ALTER TABLE public.applications 
ADD CONSTRAINT applications_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update the applications table to use the new status enum
ALTER TABLE public.applications 
ALTER COLUMN status TYPE application_status USING status::text::application_status;

-- Add indexes for better performance on workflow queries
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_property_status ON public.applications(property_id, status);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_status ON public.viewing_requests(status);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_property_tenant ON public.viewing_requests(property_id, tenant_id);

-- Update RLS policies for viewing_requests to work with profiles
DROP POLICY IF EXISTS "Users can view own viewing requests" ON public.viewing_requests;
DROP POLICY IF EXISTS "Tenants can create viewing requests" ON public.viewing_requests;
DROP POLICY IF EXISTS "Landlords can update viewing requests for own properties" ON public.viewing_requests;

-- Create new RLS policies that work with the profiles table
CREATE POLICY "Users can view own viewing requests" ON public.viewing_requests FOR SELECT USING (
    auth.uid() = tenant_id OR 
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.landlord_id = auth.uid())
);

CREATE POLICY "Tenants can create viewing requests" ON public.viewing_requests FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND id = tenant_id AND role = 'tenant')
);

CREATE POLICY "Landlords can update viewing requests for own properties" ON public.viewing_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.landlord_id = auth.uid())
);

-- Update RLS policies for applications to work with profiles
DROP POLICY IF EXISTS "Users can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Tenants can create applications" ON public.applications;
DROP POLICY IF EXISTS "Landlords can update applications for own properties" ON public.applications;

-- Create new RLS policies for applications
CREATE POLICY "Users can view own applications" ON public.applications FOR SELECT USING (
    auth.uid() = tenant_id OR 
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.landlord_id = auth.uid())
);

CREATE POLICY "Tenants can create applications" ON public.applications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND id = tenant_id AND role = 'tenant')
);

CREATE POLICY "Landlords can update applications for own properties" ON public.applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.landlord_id = auth.uid())
);

-- Create a function to handle application workflow transitions
CREATE OR REPLACE FUNCTION handle_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When application is approved, update property status if needed
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Update property to occupied status
        UPDATE public.properties 
        SET status = 'occupied',
            applications_count = GREATEST(applications_count - 1, 0)
        WHERE id = NEW.property_id;
        
        -- Set decision date
        NEW.decision_date = NOW();
        NEW.reviewed_at = NOW();
    END IF;
    
    -- When application is rejected, set decision date
    IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        NEW.decision_date = NOW();
        NEW.reviewed_at = NOW();
    END IF;
    
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for application status changes
DROP TRIGGER IF EXISTS application_status_change_trigger ON public.applications;
CREATE TRIGGER application_status_change_trigger
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION handle_application_status_change();

-- Create a function to handle viewing request status changes
CREATE OR REPLACE FUNCTION handle_viewing_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When viewing is confirmed, update application status
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE public.applications 
        SET status = 'viewing_scheduled'
        WHERE property_id = NEW.property_id AND tenant_id = NEW.tenant_id;
    END IF;
    
    -- When viewing is cancelled by tenant (declined), update application status
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE public.applications 
        SET status = 'viewing_declined'
        WHERE property_id = NEW.property_id AND tenant_id = NEW.tenant_id;
    END IF;
    
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for viewing request status changes
DROP TRIGGER IF EXISTS viewing_request_status_change_trigger ON public.viewing_requests;
CREATE TRIGGER viewing_request_status_change_trigger
    BEFORE UPDATE ON public.viewing_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_viewing_request_status_change();

-- Add a function to automatically create lease when application is approved
CREATE OR REPLACE FUNCTION create_lease_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create lease if status changed to approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO public.leases (
            application_id,
            property_id,
            tenant_id,
            landlord_id,
            monthly_rent,
            deposit_amount,
            start_date,
            end_date,
            is_active,
            signed_by_landlord,
            signed_by_tenant,
            lease_terms,
            utilities_included
        )
        SELECT 
            NEW.id,
            NEW.property_id,
            NEW.tenant_id,
            p.landlord_id,
            p.rent_amount,
            p.deposit_amount,
            NEW.proposed_move_in_date,
            (NEW.proposed_move_in_date::date + (NEW.lease_duration_requested || ' months')::interval)::date,
            true,
            true,
            false,
            'Standard lease agreement terms apply.',
            (p.water_included OR p.electricity_included OR p.gas_included)
        FROM public.properties p
        WHERE p.id = NEW.property_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic lease creation
DROP TRIGGER IF EXISTS create_lease_on_approval_trigger ON public.applications;
CREATE TRIGGER create_lease_on_approval_trigger
    AFTER UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION create_lease_on_approval();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
