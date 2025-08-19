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
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    property_type property_type NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    rent_amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2),
    utilities_included BOOLEAN DEFAULT FALSE,
    utilities_cost DECIMAL(10,2),
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    square_meters INTEGER,
    furnished BOOLEAN DEFAULT FALSE,
    pets_allowed BOOLEAN DEFAULT FALSE,
    smoking_allowed BOOLEAN DEFAULT FALSE,
    parking_available BOOLEAN DEFAULT FALSE,
    garden_access BOOLEAN DEFAULT FALSE,
    security_features TEXT[],
    amenities TEXT[],
    nearby_schools TEXT[],
    nearby_transport TEXT[],
    nearby_shopping TEXT[],
    images TEXT[],
    virtual_tour_url TEXT,
    status property_status DEFAULT 'available',
    available_from DATE,
    minimum_lease_months INTEGER DEFAULT 12,
    maximum_occupants INTEGER DEFAULT 2,
    electricity_prepaid BOOLEAN DEFAULT TRUE,
    water_included BOOLEAN DEFAULT FALSE,
    internet_included BOOLEAN DEFAULT FALSE,
    cleaning_service BOOLEAN DEFAULT FALSE,
    laundry_facilities BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
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
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    requested_date DATE NOT NULL,
    requested_time TIME NOT NULL,
    alternative_dates DATE[],
    alternative_times TIME[],
    status viewing_status DEFAULT 'requested',
    landlord_message TEXT,
    tenant_message TEXT,
    confirmed_date DATE,
    confirmed_time TIME,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE public.applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status application_status DEFAULT 'pending',
    cover_letter TEXT,
    preferred_move_in_date DATE,
    lease_duration_months INTEGER DEFAULT 12,
    references JSONB, -- Array of reference objects
    documents JSONB, -- Array of document objects
    landlord_notes TEXT,
    rejection_reason TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, tenant_id)
);

-- Leases table
CREATE TABLE public.leases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL,
    utilities_included BOOLEAN DEFAULT FALSE,
    utilities_cost DECIMAL(10,2),
    lease_terms TEXT,
    special_conditions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_signed BOOLEAN DEFAULT FALSE,
    signed_at TIMESTAMP WITH TIME ZONE,
    terminated_at TIMESTAMP WITH TIME ZONE,
    termination_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_type payment_type NOT NULL,
    status payment_status DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_method TEXT,
    transaction_reference TEXT,
    proof_of_payment_url TEXT,
    notes TEXT,
    late_fee DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
    subject TEXT,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    attachment_url TEXT,
    attachment_name TEXT,
    requires_response BOOLEAN DEFAULT FALSE,
    parent_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance requests table
CREATE TABLE public.maintenance_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority maintenance_priority DEFAULT 'medium',
    status maintenance_status DEFAULT 'reported',
    images TEXT[],
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    contractor_name TEXT,
    contractor_contact TEXT,
    scheduled_date DATE,
    completed_date DATE,
    tenant_rating INTEGER CHECK (tenant_rating >= 1 AND tenant_rating <= 5),
    tenant_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    review_type TEXT NOT NULL, -- 'tenant_to_landlord', 'landlord_to_tenant', 'property'
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reviewer_id, reviewee_id, lease_id)
);

-- Favorites table
CREATE TABLE public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, property_id)
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    related_id UUID, -- Can reference any table
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
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
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_properties_landlord_id ON public.properties(landlord_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_rent_amount ON public.properties(rent_amount);
CREATE INDEX idx_applications_property_id ON public.applications(property_id);
CREATE INDEX idx_applications_tenant_id ON public.applications(tenant_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_leases_property_id ON public.leases(property_id);
CREATE INDEX idx_leases_tenant_id ON public.leases(tenant_id);
CREATE INDEX idx_leases_is_active ON public.leases(is_active);
CREATE INDEX idx_payments_lease_id ON public.payments(lease_id);
CREATE INDEX idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX idx_messages_property_id ON public.messages(property_id);
CREATE INDEX idx_messages_is_read ON public.messages(is_read);
CREATE INDEX idx_viewing_requests_property_id ON public.viewing_requests(property_id);
CREATE INDEX idx_viewing_requests_tenant_id ON public.viewing_requests(tenant_id);
CREATE INDEX idx_viewing_requests_status ON public.viewing_requests(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tenant profiles policies
CREATE POLICY "Tenants can view their own profile" ON public.tenant_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Tenants can update their own profile" ON public.tenant_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Landlords can view tenant profiles for their properties" ON public.tenant_profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.properties p ON a.property_id = p.id
        WHERE a.tenant_id = tenant_profiles.id AND p.landlord_id = auth.uid()
    )
);

-- Landlord profiles policies
CREATE POLICY "Landlords can view their own profile" ON public.landlord_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Landlords can update their own profile" ON public.landlord_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Tenants can view landlord profiles for applied properties" ON public.landlord_profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.properties p ON a.property_id = p.id
        WHERE p.landlord_id = landlord_profiles.id AND a.tenant_id = auth.uid()
    )
);

-- Banking details policies
CREATE POLICY "Users can manage their own banking details" ON public.banking_details FOR ALL USING (auth.uid() = user_id);

-- Properties policies
CREATE POLICY "Anyone can view available properties" ON public.properties FOR SELECT USING (status = 'available');
CREATE POLICY "Landlords can manage their own properties" ON public.properties FOR ALL USING (auth.uid() = landlord_id);
CREATE POLICY "Tenants can view properties they have applied to" ON public.properties FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.applications
        WHERE property_id = properties.id AND tenant_id = auth.uid()
    )
);

-- Applications policies
CREATE POLICY "Tenants can manage their own applications" ON public.applications FOR ALL USING (auth.uid() = tenant_id);
CREATE POLICY "Landlords can view applications for their properties" ON public.applications FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.properties
        WHERE id = applications.property_id AND landlord_id = auth.uid()
    )
);
CREATE POLICY "Landlords can update applications for their properties" ON public.applications FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.properties
        WHERE id = applications.property_id AND landlord_id = auth.uid()
    )
);

-- Leases policies
CREATE POLICY "Tenants can view their own leases" ON public.leases FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY "Landlords can manage leases for their properties" ON public.leases FOR ALL USING (auth.uid() = landlord_id);

-- Payments policies
CREATE POLICY "Tenants can manage their own payments" ON public.payments FOR ALL USING (auth.uid() = tenant_id);
CREATE POLICY "Landlords can view payments for their properties" ON public.payments FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update payment status" ON public.payments FOR UPDATE USING (auth.uid() = landlord_id);

-- Messages policies
CREATE POLICY "Users can view messages they sent or received" ON public.messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update messages they received" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- Viewing requests policies
CREATE POLICY "Tenants can manage their own viewing requests" ON public.viewing_requests FOR ALL USING (auth.uid() = tenant_id);
CREATE POLICY "Landlords can view and update viewing requests for their properties" ON public.viewing_requests FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.properties
        WHERE id = viewing_requests.property_id AND landlord_id = auth.uid()
    )
);

-- Maintenance requests policies
CREATE POLICY "Tenants can manage their own maintenance requests" ON public.maintenance_requests FOR ALL USING (auth.uid() = tenant_id);
CREATE POLICY "Landlords can manage maintenance requests for their properties" ON public.maintenance_requests FOR ALL USING (auth.uid() = landlord_id);

-- Reviews policies
CREATE POLICY "Users can view all reviews" ON public.reviews FOR SELECT TO authenticated;
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);

-- Favorites policies
CREATE POLICY "Tenants can manage their own favorites" ON public.favorites FOR ALL USING (auth.uid() = tenant_id);

-- Property images policies
CREATE POLICY "Anyone can view property images" ON public.property_images FOR SELECT TO authenticated;
CREATE POLICY "Landlords can manage images for their properties" ON public.property_images FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.properties
        WHERE id = property_images.property_id AND landlord_id = auth.uid()
    )
);

-- Notifications policies
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
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
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_favorites_updated_at BEFORE UPDATE ON public.favorites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
