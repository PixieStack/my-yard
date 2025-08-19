-- Fix RLS policies for applications table
DROP POLICY IF EXISTS "Users can insert own applications" ON applications;
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Landlords can view applications for their properties" ON applications;

-- Allow tenants to insert applications
CREATE POLICY "Tenants can insert applications" ON applications
  FOR INSERT WITH CHECK (
    auth.uid() = tenant_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant'
    )
  );

-- Allow tenants to view their own applications
CREATE POLICY "Tenants can view own applications" ON applications
  FOR SELECT USING (auth.uid() = tenant_id);

-- Allow landlords to view applications for their properties
CREATE POLICY "Landlords can view property applications" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties p
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = applications.property_id 
      AND p.landlord_id = auth.uid()
      AND pr.role = 'landlord'
    )
  );

-- Allow landlords to update applications for their properties
CREATE POLICY "Landlords can update property applications" ON applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM properties p
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = applications.property_id 
      AND p.landlord_id = auth.uid()
      AND pr.role = 'landlord'
    )
  );
