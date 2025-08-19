-- Fix viewing_status enum and foreign key references
ALTER TYPE viewing_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE viewing_status ADD VALUE IF NOT EXISTS 'declined';

-- Fix foreign key reference in viewing_requests table
ALTER TABLE public.viewing_requests 
DROP CONSTRAINT IF EXISTS viewing_requests_tenant_id_fkey;

ALTER TABLE public.viewing_requests 
ADD CONSTRAINT viewing_requests_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update any existing records that might have wrong references
UPDATE public.viewing_requests 
SET tenant_id = (
  SELECT p.id 
  FROM public.profiles p 
  WHERE p.user_type = 'tenant' 
  AND p.id = viewing_requests.tenant_id
) 
WHERE tenant_id IS NOT NULL;
