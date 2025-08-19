-- MyYard Property Management System - Improved Schema with Proper Separation
-- Run this script in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('landlord', 'tenant');
CREATE TYPE property_type AS ENUM ('room', 'bachelor', 'cottage');
CREATE TYPE property_status AS ENUM ('available', 'occupied', 'maintenance');
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'overdue');
CREATE TYPE payment_type AS ENUM ('rent', 'deposit', 'utilities', 'maintenance');
CREATE TYPE viewing_status AS ENUM ('requested', 'confirmed', 'completed', 'cancelled');
CREATE TYPE maintenance_status AS ENUM ('reported', 'in_progress', 'completed');
CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Base profiles table (minimal shared data)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Separate tenant-specific data table
CREATE TABLE public.tenant_profiles (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    date_of_birth DATE,
    id_number TEXT,
    current_address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    employment_status TEXT,
    employer_name TEXT,
    job_title TEXT,
    monthly_income DECIMAL(10,2),
    employment_duration_months INTEGER,
    previous_landlord_contact TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    has_pets BOOLEAN DEFAULT FALSE,
    pet_details TEXT,
    smoking BOOLEAN DEFAULT FALSE,
    preferred_move_in_date DATE,
    max_budget DECIMAL(10,2),
    preferred_areas TEXT[],
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    successful_rentals INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Separate landlord-specific data table
CREATE TABLE public.landlord_profiles (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    business_name TEXT,
    business_registration_number TEXT,
    tax_number TEXT,
    years_experience INTEGER DEFAULT 0,
    total_properties INTEGER DEFAULT 0,
    active_properties INTEGER DEFAULT 0,
    occupied_properties INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    response_time_hours INTEGER DEFAULT 24,
    accepts_pets BOOLEAN DEFAULT FALSE,
    allows_smoking BOOLEAN DEFAULT FALSE,
    preferred_tenant_type TEXT, -- 'students', 'professionals', 'families', 'any'
    minimum_lease_months INTEGER DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Separate banking information table (loose coupling for security)
CREATE TABLE public.banking_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    bank_name TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    branch_code TEXT,
    account_type TEXT, -- 'savings', 'current', 'transmission'
    is_primary BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status verification_status DEFAULT 'pending',
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document storage table (loose coupling)
CREATE TABLE public.user_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL, -- 'id_copy', 'proof_of_income', 'bank_statement', 'proof_of_residence', 'business_registration'
    document_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status verification_status DEFAULT 'pending',
    verification_notes TEXT,
    expires_at DATE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Townships table (South African locations)
CREATE TABLE public.townships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    municipality TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    safety_rating DECIMAL(3,2) DEFAULT 0.00,
    transport_rating DECIMAL(3,2) DEFAULT 0.00,
    amenities_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table (linked to landlords)
CREATE TABLE public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    landlord_id UUID REFERENCES public.landlord_profiles(id) ON DELETE CASCADE NOT NULL,
    township_id UUID REFERENCES public.townships(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    property_type property_type NOT NULL,
    rent_amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2),
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    square_meters INTEGER,
    address TEXT NOT NULL,
    gps_coordinates POINT,
    is_furnished BOOLEAN DEFAULT FALSE,
    pets_allowed BOOLEAN DEFAULT FALSE,
    smoking_allowed BOOLEAN DEFAULT FALSE,
    parking_spaces INTEGER DEFAULT 0,
    garden_access BOOLEAN DEFAULT FALSE,
    wifi_included BOOLEAN DEFAULT FALSE,
    electricity_included BOOLEAN DEFAULT FALSE,
    water_included BOOLEAN DEFAULT FALSE,
    gas_included BOOLEAN DEFAULT FALSE,
    security_features TEXT[],
    nearby_amenities TEXT[],
    transport_access TEXT[],
    status property_status DEFAULT 'available',
    available_from DATE,
    lease_duration_months INTEGER DEFAULT 12,
    minimum_lease_months INTEGER DEFAULT 6,
    maximum_lease_months INTEGER DEFAULT 24,
    is_active BOOLEAN DEFAULT TRUE,
    views_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    last_maintenance_date DATE,
    next_inspection_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property images table
CREATE TABLE public.property_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    image_type TEXT DEFAULT 'general', -- 'exterior', 'interior', 'bedroom', 'bathroom', 'kitchen', 'general'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property amenities table
CREATE TABLE public.property_amenities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    amenity_category TEXT NOT NULL, -- 'appliances', 'furniture', 'utilities', 'security', 'outdoor'
    amenity_name TEXT NOT NULL,
    amenity_description TEXT,
    is_included_in_rent BOOLEAN DEFAULT TRUE,
    additional_cost DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Viewing requests table
CREATE TABLE public.viewing_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.tenant_profiles(id) ON DELETE CASCADE NOT NULL,
    requested_date DATE NOT NULL,
    requested_time TIME NOT NULL,
    alternative_date_1 DATE,
    alternative_time_1 TIME,
    alternative_date_2 DATE,
    alternative_time_2 TIME,
    status viewing_status DEFAULT 'requested',
    tenant_message TEXT,
    landlord_response TEXT,
    confirmed_date DATE,
    confirmed_time TIME,
    viewing_notes TEXT,
    tenant_showed_up BOOLEAN,
    landlord_feedback TEXT,
    tenant_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE public.applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.tenant_profiles(id) ON DELETE CASCADE NOT NULL,
    status application_status DEFAULT 'pending',
    proposed_move_in_date DATE,
    lease_duration_requested INTEGER DEFAULT 12,
    additional_occupants INTEGER DEFAULT 0,
    additional_occupants_details TEXT,
    rental_references JSONB,
    character_references JSONB,
    special_requests TEXT,
    tenant_notes TEXT,
    landlord_notes TEXT,
    rejection_reason TEXT,
    credit_check_consent BOOLEAN DEFAULT FALSE,
    background_check_consent BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    decision_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leases table
CREATE TABLE public.leases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.tenant_profiles(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.landlord_profiles(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES public.applications(id),
    lease_number TEXT UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL,
    utilities_included BOOLEAN DEFAULT FALSE,
    utilities_cap DECIMAL(10,2),
    late_payment_fee DECIMAL(10,2) DEFAULT 0.00,
    early_termination_fee DECIMAL(10,2),
    lease_terms TEXT,
    special_conditions TEXT,
    renewal_terms TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_renewable BOOLEAN DEFAULT TRUE,
    auto_renewal BOOLEAN DEFAULT FALSE,
    signed_by_tenant BOOLEAN DEFAULT FALSE,
    signed_by_landlord BOOLEAN DEFAULT FALSE,
    tenant_signature_date TIMESTAMP WITH TIME ZONE,
    landlord_signature_date TIMESTAMP WITH TIME ZONE,
    witness_name TEXT,
    witness_signature_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenant_profiles(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.landlord_profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_type payment_type NOT NULL,
    status payment_status DEFAULT 'pending',
    due_date DATE,
    paid_date TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    transaction_reference TEXT,
    bank_reference TEXT,
    description TEXT,
    late_fee DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    receipt_url TEXT,
    payment_proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
    subject TEXT,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'general', -- 'general', 'viewing', 'application', 'maintenance', 'payment', 'lease'
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    attachment_url TEXT,
    attachment_name TEXT,
    requires_response BOOLEAN DEFAULT FALSE,
    parent_message_id UUID REFERENCES public.messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance requests table
CREATE TABLE public.maintenance_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.tenant_profiles(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.landlord_profiles(id) ON DELETE CASCADE NOT NULL,
    lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- 'plumbing', 'electrical', 'heating', 'appliances', 'structural', 'other'
    priority maintenance_priority DEFAULT 'medium',
    status maintenance_status DEFAULT 'reported',
    is_emergency BOOLEAN DEFAULT FALSE,
    tenant_available_times TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    cost_approved_by_tenant BOOLEAN DEFAULT FALSE,
    scheduled_date DATE,
    completed_date DATE,
    contractor_name TEXT,
    contractor_contact TEXT,
    contractor_cost DECIMAL(10,2),
    warranty_period_days INTEGER,
    landlord_notes TEXT,
    tenant_satisfaction_rating INTEGER CHECK (tenant_satisfaction_rating >= 1 AND tenant_satisfaction_rating <= 5),
    tenant_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance images table
CREATE TABLE public.maintenance_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    maintenance_request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    image_type TEXT DEFAULT 'before', -- 'before', 'during', 'after', 'damage'
    uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    review_type TEXT NOT NULL, -- 'property', 'landlord', 'tenant'
    review_categories JSONB, -- {'cleanliness': 5, 'communication': 4, 'maintenance': 3}
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    landlord_response TEXT,
    landlord_response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites table
CREATE TABLE public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- Email verifications table
CREATE TABLE public.email_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phone verifications table
CREATE TABLE public.phone_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    phone TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert South African Townships Data
INSERT INTO public.townships (name, municipality, province, postal_code, safety_rating, transport_rating, amenities_rating) VALUES
-- Gauteng Province
('Soweto', 'City of Johannesburg', 'Gauteng', '1818', 3.5, 4.0, 4.2),
('Alexandra', 'City of Johannesburg', 'Gauteng', '2090', 3.2, 4.5, 3.8),
('Diepsloot', 'City of Johannesburg', 'Gauteng', '2189', 3.0, 3.5, 3.2),
('Orange Farm', 'City of Johannesburg', 'Gauteng', '1841', 3.1, 3.8, 3.5),
('Ivory Park', 'City of Johannesburg', 'Gauteng', '1685', 3.3, 4.0, 3.7),
('Tembisa', 'Ekurhuleni', 'Gauteng', '1632', 3.6, 4.2, 4.0),
('Katlehong', 'Ekurhuleni', 'Gauteng', '1431', 3.4, 4.1, 3.9),
('Thokoza', 'Ekurhuleni', 'Gauteng', '1426', 3.2, 4.0, 3.6),
('Vosloorus', 'Ekurhuleni', 'Gauteng', '1400', 3.5, 4.1, 3.8),
('Duduza', 'Ekurhuleni', 'Gauteng', '1496', 3.3, 3.9, 3.7),
('Soshanguve', 'City of Tshwane', 'Gauteng', '0152', 3.7, 4.3, 4.1),
('Mamelodi', 'City of Tshwane', 'Gauteng', '0122', 3.8, 4.4, 4.2),
('Atteridgeville', 'City of Tshwane', 'Gauteng', '0008', 3.9, 4.5, 4.3),
('Hammanskraal', 'City of Tshwane', 'Gauteng', '0400', 3.4, 3.7, 3.5),

-- Western Cape Province
('Khayelitsha', 'City of Cape Town', 'Western Cape', '7784', 3.1, 4.0, 3.8),
('Mitchells Plain', 'City of Cape Town', 'Western Cape', '7785', 3.3, 4.2, 4.0),
('Gugulethu', 'City of Cape Town', 'Western Cape', '7750', 3.5, 4.3, 4.1),
('Langa', 'City of Cape Town', 'Western Cape', '7455', 3.7, 4.5, 4.2),
('Nyanga', 'City of Cape Town', 'Western Cape', '7755', 3.0, 3.8, 3.6),
('Crossroads', 'City of Cape Town', 'Western Cape', '7764', 3.2, 3.9, 3.7),
('Philippi', 'City of Cape Town', 'Western Cape', '7785', 3.4, 4.1, 3.9),
('Delft', 'City of Cape Town', 'Western Cape', '7100', 3.6, 4.2, 4.0),

-- KwaZulu-Natal Province
('Umlazi', 'eThekwini', 'KwaZulu-Natal', '4031', 3.3, 4.0, 3.8),
('KwaMashu', 'eThekwini', 'KwaZulu-Natal', '4360', 3.5, 4.1, 3.9),
('Inanda', 'eThekwini', 'KwaZulu-Natal', '4310', 3.2, 3.8, 3.6),
('Ntuzuma', 'eThekwini', 'KwaZulu-Natal', '4359', 3.4, 4.0, 3.8),
('Lamontville', 'eThekwini', 'KwaZulu-Natal', '4125', 3.6, 4.2, 4.0),
('Chesterville', 'eThekwini', 'KwaZulu-Natal', '4091', 3.7, 4.3, 4.1),

-- Eastern Cape Province
('Mdantsane', 'Buffalo City', 'Eastern Cape', '5219', 3.1, 3.7, 3.5),
('Duncan Village', 'Buffalo City', 'Eastern Cape', '5200', 3.0, 3.6, 3.4),
('New Brighton', 'Nelson Mandela Bay', 'Eastern Cape', '6205', 3.4, 4.0, 3.8),
('KwaZakhele', 'Nelson Mandela Bay', 'Eastern Cape', '6205', 3.3, 3.9, 3.7),
('Motherwell', 'Nelson Mandela Bay', 'Eastern Cape', '6211', 3.5, 4.1, 3.9),

-- Free State Province
('Botshabelo', 'Mangaung', 'Free State', '9781', 3.2, 3.8, 3.6),
('Thaba Nchu', 'Mangaung', 'Free State', '9780', 3.4, 4.0, 3.8),

-- Limpopo Province
('Seshego', 'Polokwane', 'Limpopo', '0742', 3.6, 4.1, 3.9),
('Mankweng', 'Polokwane', 'Limpopo', '0727', 3.5, 4.0, 3.8),

-- Mpumalanga Province
('KwaMhlanga', 'Dr JS Moroka', 'Mpumalanga', '1022', 3.3, 3.7, 3.5),
('Emalahleni', 'Emalahleni', 'Mpumalanga', '1035', 3.7, 4.2, 4.0),

-- North West Province
('Mafikeng', 'Mahikeng', 'North West', '2745', 3.4, 3.9, 3.7),
('Rustenburg', 'Rustenburg', 'North West', '0300', 3.8, 4.3, 4.1),

-- Northern Cape Province
('Galeshewe', 'Sol Plaatje', 'Northern Cape', '8345', 3.2, 3.6, 3.4);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_tenant_profiles_monthly_income ON public.tenant_profiles(monthly_income);
CREATE INDEX idx_tenant_profiles_max_budget ON public.tenant_profiles(max_budget);
CREATE INDEX idx_landlord_profiles_rating ON public.landlord_profiles(rating);
CREATE INDEX idx_banking_details_user_id ON public.banking_details(user_id);
CREATE INDEX idx_banking_details_is_primary ON public.banking_details(is_primary);
CREATE INDEX idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX idx_user_documents_type ON public.user_documents(document_type);
CREATE INDEX idx_properties_landlord_id ON public.properties(landlord_id);
CREATE INDEX idx_properties_township_id ON public.properties(township_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_property_type ON public.properties(property_type);
CREATE INDEX idx_properties_rent_amount ON public.properties(rent_amount);
CREATE INDEX idx_property_images_property_id ON public.property_images(property_id);
CREATE INDEX idx_viewing_requests_property_id ON public.viewing_requests(property_id);
CREATE INDEX idx_viewing_requests_tenant_id ON public.viewing_requests(tenant_id);
CREATE INDEX idx_applications_property_id ON public.applications(property_id);
CREATE INDEX idx_applications_tenant_id ON public.applications(tenant_id);
CREATE INDEX idx_leases_property_id ON public.leases(property_id);
CREATE INDEX idx_leases_tenant_id ON public.leases(tenant_id);
CREATE INDEX idx_payments_lease_id ON public.payments(lease_id);
CREATE INDEX idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX idx_maintenance_requests_property_id ON public.maintenance_requests(property_id);
CREATE INDEX idx_reviews_property_id ON public.reviews(property_id);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all basic profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for tenant profiles
CREATE POLICY "Users can view own tenant profile" ON public.tenant_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can manage own tenant profile" ON public.tenant_profiles FOR ALL USING (auth.uid() = id);

-- RLS Policies for landlord profiles
CREATE POLICY "Anyone can view landlord profiles" ON public.landlord_profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage own landlord profile" ON public.landlord_profiles FOR ALL USING (auth.uid() = id);

-- RLS Policies for banking details
CREATE POLICY "Users can manage own banking details" ON public.banking_details FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user documents
CREATE POLICY "Users can manage own documents" ON public.user_documents FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for properties
CREATE POLICY "Anyone can view available properties" ON public.properties FOR SELECT USING (status = 'available' AND is_active = true);
CREATE POLICY "Landlords can manage own properties" ON public.properties FOR ALL USING (
    EXISTS (SELECT 1 FROM public.landlord_profiles WHERE id = auth.uid() AND id = landlord_id)
);

-- RLS Policies for property images
CREATE POLICY "Anyone can view property images" ON public.property_images FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND status = 'available' AND is_active = true)
);
CREATE POLICY "Landlords can manage own property images" ON public.property_images FOR ALL USING (
    EXISTS (SELECT 1 FROM public.properties p JOIN public.landlord_profiles lp ON p.landlord_id = lp.id 
            WHERE p.id = property_id AND lp.id = auth.uid())
);

-- RLS Policies for viewing requests
CREATE POLICY "Users can view own viewing requests" ON public.viewing_requests FOR SELECT USING (
    auth.uid() = tenant_id OR 
    EXISTS (SELECT 1 FROM public.properties p JOIN public.landlord_profiles lp ON p.landlord_id = lp.id 
            WHERE p.id = property_id AND lp.id = auth.uid())
);
CREATE POLICY "Tenants can create viewing requests" ON public.viewing_requests FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenant_profiles WHERE id = auth.uid() AND id = tenant_id)
);
CREATE POLICY "Landlords can update viewing requests for own properties" ON public.viewing_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties p JOIN public.landlord_profiles lp ON p.landlord_id = lp.id 
            WHERE p.id = property_id AND lp.id = auth.uid())
);

-- RLS Policies for applications
CREATE POLICY "Users can view own applications" ON public.applications FOR SELECT USING (
    auth.uid() = tenant_id OR 
    EXISTS (SELECT 1 FROM public.properties p JOIN public.landlord_profiles lp ON p.landlord_id = lp.id 
            WHERE p.id = property_id AND lp.id = auth.uid())
);
CREATE POLICY "Tenants can create applications" ON public.applications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenant_profiles WHERE id = auth.uid() AND id = tenant_id)
);
CREATE POLICY "Landlords can update applications for own properties" ON public.applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties p JOIN public.landlord_profiles lp ON p.landlord_id = lp.id 
            WHERE p.id = property_id AND lp.id = auth.uid())
);

-- RLS Policies for messages
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
    auth.uid() = tenant_id OR auth.uid() = landlord_id
);
CREATE POLICY "Tenants can create payments" ON public.payments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenant_profiles WHERE id = auth.uid() AND id = tenant_id)
);

-- RLS Policies for favorites
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_profiles_updated_at BEFORE UPDATE ON public.tenant_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_landlord_profiles_updated_at BEFORE UPDATE ON public.landlord_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banking_details_updated_at BEFORE UPDATE ON public.banking_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_viewing_requests_updated_at BEFORE UPDATE ON public.viewing_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON public.leases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create role-specific profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val user_role;
BEGIN
    -- Insert into base profiles table
    INSERT INTO public.profiles (id, first_name, last_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')::user_role
    );
    
    -- Get the role for conditional profile creation
    user_role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')::user_role;
    
    -- Create role-specific profile
    IF user_role_val = 'tenant' THEN
        INSERT INTO public.tenant_profiles (id) VALUES (NEW.id);
    ELSIF user_role_val = 'landlord' THEN
        INSERT INTO public.landlord_profiles (id) VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
