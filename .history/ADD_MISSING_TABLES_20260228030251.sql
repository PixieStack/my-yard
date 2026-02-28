-- ============================================================================
-- MINIMAL UPDATE: Only Add Missing Tables
-- This script adds ONLY the tables missing from your current schema
-- It does NOT modify any existing tables
-- ============================================================================

-- Check what tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ============================================================================
-- ADD MISSING TABLE 1: lease_termination_requests
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lease_termination_lease ON lease_termination_requests(lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_termination_tenant ON lease_termination_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lease_termination_status ON lease_termination_requests(status);

-- ============================================================================
-- ADD MISSING TABLE 2: notifications
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ============================================================================
-- ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE lease_termination_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR lease_termination_requests
-- ============================================================================

-- Tenants can create their own termination requests
DROP POLICY IF EXISTS "Tenants can create termination requests" ON lease_termination_requests;
CREATE POLICY "Tenants can create termination requests" ON lease_termination_requests 
FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- Tenants can see their own requests
DROP POLICY IF EXISTS "Tenants can read own termination requests" ON lease_termination_requests;
CREATE POLICY "Tenants can read own termination requests" ON lease_termination_requests 
FOR SELECT USING (tenant_id = auth.uid());

-- Landlords can see termination requests for their leases
DROP POLICY IF EXISTS "Landlords can read termination requests" ON lease_termination_requests;
CREATE POLICY "Landlords can read termination requests" ON lease_termination_requests 
FOR SELECT USING (
  lease_id IN (SELECT id FROM leases WHERE landlord_id = auth.uid())
);

-- Landlords can update (respond to) termination requests
DROP POLICY IF EXISTS "Landlords can update termination requests" ON lease_termination_requests;
CREATE POLICY "Landlords can update termination requests" ON lease_termination_requests 
FOR UPDATE USING (
  lease_id IN (SELECT id FROM leases WHERE landlord_id = auth.uid())
);

-- ============================================================================
-- RLS POLICIES FOR notifications
-- ============================================================================

-- Users can read their own notifications
DROP POLICY IF EXISTS "Users can read their notifications" ON notifications;
CREATE POLICY "Users can read their notifications" ON notifications 
FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications 
FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their notifications
DROP POLICY IF EXISTS "Users can delete their notifications" ON notifications;
CREATE POLICY "Users can delete their notifications" ON notifications 
FOR DELETE USING (user_id = auth.uid());

-- System can create notifications (backend/API) - Allow all inserts
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications 
FOR INSERT WITH CHECK (true);

-- Allow authenticated users to create notifications
DROP POLICY IF EXISTS "Authenticated can create notifications" ON notifications;
CREATE POLICY "Authenticated can create notifications" ON notifications 
FOR INSERT WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- If you see this message, the update was successful!
SELECT 'Minimal update completed! Added lease_termination_requests and notifications tables.' as status;
