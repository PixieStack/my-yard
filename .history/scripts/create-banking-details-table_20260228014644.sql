-- Create landlord banking details table
CREATE TABLE IF NOT EXISTS landlord_banking_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) DEFAULT 'CHEQUE', -- CHEQUE, SAVINGS, TRANSMISSION
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE landlord_banking_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Landlords can view own banking details"
  ON landlord_banking_details FOR SELECT
  USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert own banking details"
  ON landlord_banking_details FOR INSERT
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own banking details"
  ON landlord_banking_details FOR UPDATE
  USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete own banking details"
  ON landlord_banking_details FOR DELETE
  USING (auth.uid() = landlord_id);

-- Create payment receipts table
CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  receipt_url VARCHAR(512) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenants can view receipts for their payments"
  ON payment_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payments p
      WHERE p.id = payment_id AND p.tenant_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can upload receipts"
  ON payment_receipts FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Landlords can view receipts for their payments"
  ON payment_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payments p
      JOIN properties pr ON pr.id = p.property_id
      WHERE p.id = payment_id AND pr.landlord_id = auth.uid()
    )
  );
