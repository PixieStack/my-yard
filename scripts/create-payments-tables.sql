-- Payments System Database Schema

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  ozow_reference TEXT UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
  
  -- Payment details
  type TEXT NOT NULL CHECK (type IN ('move_in', 'monthly_rent', 'deposit_return', 'admin_fee', 'cancellation_penalty')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
  
  -- Amounts in cents (ZAR)
  amount BIGINT NOT NULL,
  deposit_amount BIGINT DEFAULT 0,
  rent_amount BIGINT DEFAULT 0,
  utilities_amount BIGINT DEFAULT 0,
  admin_fee_amount BIGINT DEFAULT 0,
  penalty_amount BIGINT DEFAULT 0,
  total_amount BIGINT NOT NULL,
  
  -- Ozow details
  ozow_site_code TEXT,
  ozow_transaction_reference TEXT,
  ozow_status TEXT,
  ozow_status_message TEXT,
  ozow_hash TEXT,
  
  -- Metadata
  description TEXT,
  payment_method TEXT,
  payment_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Payment splits table (for tracking admin fees and splits)
CREATE TABLE IF NOT EXISTS payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('landlord', 'app_owner', 'tenant')),
  recipient_id UUID REFERENCES profiles(id),
  amount BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_property ON payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_lease ON payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_splits_payment ON payment_splits(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_recipient ON payment_splits(recipient_id);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = payments.property_id AND p.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Users can create payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payments" ON payments
  FOR UPDATE USING (true);

-- RLS Policies for payment splits
CREATE POLICY "Recipients can view their splits" ON payment_splits
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "System can manage splits" ON payment_splits
  FOR ALL USING (true);

-- Function to calculate admin fee (R375 or 15% of rent, whichever is less)
CREATE OR REPLACE FUNCTION calculate_admin_fee(rent_amount_cents BIGINT)
RETURNS BIGINT AS $$
BEGIN
  RETURN LEAST(37500, (rent_amount_cents * 15) / 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create payment splits
CREATE OR REPLACE FUNCTION create_payment_splits(p_payment_id UUID)
RETURNS VOID AS $$
DECLARE
  v_payment payments;
  v_landlord_amount BIGINT;
  v_admin_fee BIGINT;
  v_app_owner_id UUID;
BEGIN
  -- Get payment details
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
  
  -- Get app owner ID from environment or default
  v_app_owner_id := (SELECT id FROM profiles WHERE email = 'admin@myyard.co.za' LIMIT 1);
  
  IF v_payment.type = 'move_in' THEN
    -- For move-in: landlord gets deposit + first month rent minus admin fee
    v_admin_fee := v_payment.admin_fee_amount;
    v_landlord_amount := v_payment.total_amount - v_admin_fee;
    
    -- Create split for landlord
    INSERT INTO payment_splits (payment_id, recipient_type, recipient_id, amount, description)
    VALUES (
      p_payment_id,
      'landlord',
      (SELECT landlord_id FROM properties WHERE id = v_payment.property_id),
      v_landlord_amount,
      'Move-in payment (deposit + first month rent)'
    );
    
    -- Create split for app owner (admin fee)
    IF v_admin_fee > 0 AND v_app_owner_id IS NOT NULL THEN
      INSERT INTO payment_splits (payment_id, recipient_type, recipient_id, amount, description)
      VALUES (p_payment_id, 'app_owner', v_app_owner_id, v_admin_fee, 'Admin fee');
    END IF;
    
  ELSIF v_payment.type = 'monthly_rent' THEN
    -- For monthly rent: landlord gets full amount (no admin fee after move-in)
    INSERT INTO payment_splits (payment_id, recipient_type, recipient_id, amount, description)
    VALUES (
      p_payment_id,
      'landlord',
      (SELECT landlord_id FROM properties WHERE id = v_payment.property_id),
      v_payment.total_amount,
      'Monthly rent payment'
    );
    
  ELSIF v_payment.type = 'deposit_return' THEN
    -- Deposit return goes to tenant
    INSERT INTO payment_splits (payment_id, recipient_type, recipient_id, amount, description)
    VALUES (p_payment_id, 'tenant', v_payment.user_id, v_payment.total_amount, 'Deposit return');
    
  ELSIF v_payment.type = 'cancellation_penalty' THEN
    -- Cancellation penalty: R300 to app owner
    IF v_app_owner_id IS NOT NULL THEN
      INSERT INTO payment_splits (payment_id, recipient_type, recipient_id, amount, description)
      VALUES (p_payment_id, 'app_owner', v_app_owner_id, v_payment.total_amount, 'Cancellation penalty');
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create splits when payment is completed
CREATE OR REPLACE FUNCTION trigger_create_payment_splits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM create_payment_splits(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payment_splits ON payments;
CREATE TRIGGER trigger_payment_splits
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_payment_splits();
