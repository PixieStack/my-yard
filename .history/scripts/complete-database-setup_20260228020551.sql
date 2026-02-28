-- Complete MyYard Database Setup
-- This script ensures all necessary tables exist and are properly configured

-- ============================================================================
-- STEP 1: Verify Core Tables Exist
-- ============================================================================

-- Profiles table (already exists from auth)
-- Ensure it has all required fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'tenant';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================================
-- STEP 2: Townships Table (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS townships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  municipality TEXT,
  province TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert main South African townships
INSERT INTO townships (name, municipality, province) VALUES
('Soweto', 'City of Johannesburg', 'Gauteng'),
('Sandton', 'City of Johannesburg', 'Gauteng'),
('Randburg', 'City of Johannesburg', 'Gauteng'),
('Pretoria', 'City of Tshwane', 'Gauteng'),
('Midrand', 'City of Johannesburg', 'Gauteng'),
('Fourways', 'City of Johannesburg', 'Gauteng'),
('Bryanston', 'City of Johannesburg', 'Gauteng'),
('Sunninghill', 'City of Johannesburg', 'Gauteng'),
('Roodepoort', 'City of Johannesburg', 'Gauteng'),
('Johannesburg CBD', 'City of Johannesburg', 'Gauteng'),
('Hillbrow', 'City of Johannesburg', 'Gauteng'),
('Berea', 'City of Johannesburg', 'Gauteng'),
('Westdene', 'City of Johannesburg', 'Gauteng'),
('Observatory', 'City of Johannesburg', 'Gauteng'),
('Rosebank', 'City of Johannesburg', 'Gauteng'),
('Parktown', 'City of Johannesburg', 'Gauteng'),
('Melrose', 'City of Johannesburg', 'Gauteng'),
('Illovo', 'City of Johannesburg', 'Gauteng'),
('Craighall', 'City of Johannesburg', 'Gauteng'),
('Houghton', 'City of Johannesburg', 'Gauteng')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 3: Properties Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  location TEXT,
  township_id UUID REFERENCES townships(id),
  township TEXT,
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('room', 'bachelor', 'cottage')),
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  bedrooms INT DEFAULT 0,
  bathrooms INT DEFAULT 0,
  size_sqm INT,
  price_per_month DECIMAL(10,2) NOT NULL,
  rent_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  is_furnished BOOLEAN DEFAULT FALSE,
  pets_allowed BOOLEAN DEFAULT FALSE,
  water_included BOOLEAN DEFAULT FALSE,
  electricity_included BOOLEAN DEFAULT FALSE,
  gas_included BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  landlord_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_township ON properties(township_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);

-- ============================================================================
-- STEP 4: Property Images Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);

-- ============================================================================
-- STEP 5: Viewing Requests Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS viewing_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id),
  tenant_id UUID NOT NULL REFERENCES auth.users(id),
  requested_date DATE NOT NULL,
  requested_time TIME DEFAULT '10:00:00',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'requested', 'confirmed', 'scheduled', 'completed', 'declined', 'application_submitted')),
  tenant_message TEXT,
  landlord_message TEXT,
  landlord_response TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_viewing_requests_property ON viewing_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_tenant ON viewing_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_status ON viewing_requests(status);

-- ============================================================================
-- STEP 6: Applications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id),
  tenant_id UUID NOT NULL REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'viewing_requested', 'viewing_scheduled', 'viewing_accepted', 'awaiting_landlord_decision', 'approved', 'rejected')),
  applied_at TIMESTAMP DEFAULT NOW(),
  proposed_move_in_date DATE,
  lease_duration_requested INT DEFAULT 12,
  additional_occupants INT DEFAULT 0,
  additional_occupants_details TEXT,
  tenant_notes TEXT,
  special_requests TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_property ON applications(property_id);
CREATE INDEX IF NOT EXISTS idx_applications_tenant ON applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- ============================================================================
-- STEP 7: Leases Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS leases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  tenant_id UUID NOT NULL REFERENCES auth.users(id),
  landlord_id UUID NOT NULL REFERENCES auth.users(id),
  monthly_rent DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  deposit_amount DECIMAL(10,2),
  signed_by_landlord BOOLEAN DEFAULT FALSE,
  signed_by_tenant BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  lease_terms TEXT,
  utilities_included BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leases_property ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_landlord ON leases(landlord_id);
CREATE INDEX IF NOT EXISTS idx_leases_active ON leases(is_active);

-- ============================================================================
-- STEP 8: Payments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID REFERENCES leases(id),
  tenant_id UUID NOT NULL REFERENCES auth.users(id),
  landlord_id UUID NOT NULL REFERENCES auth.users(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_type VARCHAR(50) DEFAULT 'rent' CHECK (payment_type IN ('rent', 'deposit', 'utilities', 'admin_fee', 'maintenance')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'overdue')),
  payment_method VARCHAR(50),
  transaction_id TEXT,
  ozow_reference TEXT,
  ozow_status TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_landlord ON payments(landlord_id);
CREATE INDEX IF NOT EXISTS idx_payments_lease ON payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================================================
-- STEP 9: Messages Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  property_id UUID REFERENCES properties(id),
  subject TEXT,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'general' CHECK (message_type IN ('general', 'viewing', 'payment', 'maintenance', 'lease')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_property ON messages(property_id);

-- ============================================================================
-- STEP 10: Favorites Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property ON favorites(property_id);

-- ============================================================================
-- STEP 11: Tenant Profiles Table (Extended tenant information)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  date_of_birth DATE,
  id_number TEXT,
  current_address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  employment_status VARCHAR(50),
  employer_name TEXT,
  job_title TEXT,
  monthly_income DECIMAL(12,2),
  employment_duration_months INT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  previous_address TEXT,
  reason_for_moving TEXT,
  preferred_move_in_date DATE,
  max_rent_budget DECIMAL(10,2),
  preferred_property_type VARCHAR(50),
  pets BOOLEAN,
  pet_details TEXT,
  smoking BOOLEAN,
  additional_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 12: Lease Termination Requests Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS lease_termination_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES leases(id),
  tenant_id UUID NOT NULL REFERENCES auth.users(id),
  requested_termination_date DATE NOT NULL,
  reason TEXT NOT NULL,
  notice_period_days INT DEFAULT 30,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  landlord_response TEXT,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lease_termination_lease ON lease_termination_requests(lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_termination_tenant ON lease_termination_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lease_termination_status ON lease_termination_requests(status);

-- ============================================================================
-- STEP 13: Notifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(50),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ============================================================================
-- STEP 12: RLS (Row Level Security) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_termination_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Properties: Public READ, Owner can do all
DROP POLICY IF EXISTS "Public can read available properties" ON properties;
CREATE POLICY "Public can read available properties" ON properties FOR SELECT USING (status = 'available');

DROP POLICY IF EXISTS "Landlords can manage own properties" ON properties;
CREATE POLICY "Landlords can manage own properties" ON properties FOR ALL USING (landlord_id = auth.uid());

-- Messages: Users can see their own messages
DROP POLICY IF EXISTS "Users can read their messages" ON messages;
CREATE POLICY "Users can read their messages" ON messages FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Notifications: Users can read their own
DROP POLICY IF EXISTS "Users can read their notifications" ON notifications;
CREATE POLICY "Users can read their notifications" ON notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Favorites: Users can manage their own
DROP POLICY IF EXISTS "Users can manage their favorites" ON favorites;
CREATE POLICY "Users can manage their favorites" ON favorites FOR ALL USING (user_id = auth.uid());

-- Viewing Requests: Tenant can create, landlord/tenant can read
DROP POLICY IF EXISTS "Viewing requests select" ON viewing_requests;
CREATE POLICY "Viewing requests select" ON viewing_requests FOR SELECT USING (
  tenant_id = auth.uid() OR 
  property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid())
);

DROP POLICY IF EXISTS "Tenants can create viewing requests" ON viewing_requests;
CREATE POLICY "Tenants can create viewing requests" ON viewing_requests FOR INSERT WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Landlords can update viewing requests" ON viewing_requests;
CREATE POLICY "Landlords can update viewing requests" ON viewing_requests FOR UPDATE USING (
  property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid())
);

-- Applications: Tenant can create, both can read, landlord can update
DROP POLICY IF EXISTS "Applications select" ON applications;
CREATE POLICY "Applications select" ON applications FOR SELECT USING (
  tenant_id = auth.uid() OR 
  property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid())
);

DROP POLICY IF EXISTS "Tenants can create applications" ON applications;
CREATE POLICY "Tenants can create applications" ON applications FOR INSERT WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Landlords can update applications" ON applications;
CREATE POLICY "Landlords can update applications" ON applications FOR UPDATE USING (
  property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid())
);

-- Leases: Both parties can read
DROP POLICY IF EXISTS "Leases select" ON leases;
CREATE POLICY "Leases select" ON leases FOR SELECT USING (
  tenant_id = auth.uid() OR landlord_id = auth.uid()
);

-- Both can update their own signature
DROP POLICY IF EXISTS "Tenants can sign leases" ON leases;
CREATE POLICY "Tenants can sign leases" ON leases FOR UPDATE USING (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Landlords can sign leases" ON leases;
CREATE POLICY "Landlords can sign leases" ON leases FOR UPDATE USING (landlord_id = auth.uid());

-- Payments: Both parties can read, system can create
DROP POLICY IF EXISTS "Payments select" ON payments;
CREATE POLICY "Payments select" ON payments FOR SELECT USING (
  tenant_id = auth.uid() OR landlord_id = auth.uid()
);

DROP POLICY IF EXISTS "System can create payments" ON payments;
CREATE POLICY "System can create payments" ON payments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update payments" ON payments;
CREATE POLICY "System can update payments" ON payments FOR UPDATE WITH CHECK (true);

-- Tenant Profiles: Users can manage their own
DROP POLICY IF EXISTS "Users can manage their tenant profile" ON tenant_profiles;
CREATE POLICY "Users can manage their tenant profile" ON tenant_profiles FOR ALL USING (id = auth.uid());

DROP POLICY IF EXISTS "System can create tenant profiles" ON tenant_profiles;
CREATE POLICY "System can create tenant profiles" ON tenant_profiles FOR INSERT WITH CHECK (true);

-- Lease Termination Requests: Tenant can create, both can read, landlord can update
DROP POLICY IF EXISTS "Lease termination requests select" ON lease_termination_requests;
CREATE POLICY "Lease termination requests select" ON lease_termination_requests FOR SELECT USING (
  tenant_id = auth.uid() OR 
  lease_id IN (SELECT id FROM leases WHERE landlord_id = auth.uid())
);

DROP POLICY IF EXISTS "Tenants can create termination requests" ON lease_termination_requests;
CREATE POLICY "Tenants can create termination requests" ON lease_termination_requests FOR INSERT WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Landlords can update termination requests" ON lease_termination_requests;
CREATE POLICY "Landlords can update termination requests" ON lease_termination_requests FOR UPDATE USING (
  lease_id IN (SELECT id FROM leases WHERE landlord_id = auth.uid())
);
