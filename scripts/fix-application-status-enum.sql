-- Fix application_status enum to include viewing-related statuses
-- Adding missing enum values for viewing workflow

-- First, let's see what enum values currently exist
DO $$
BEGIN
    -- Add new enum values if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'viewing_requested' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'application_status')
    ) THEN
        ALTER TYPE application_status ADD VALUE 'viewing_requested';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'viewing_scheduled' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'application_status')
    ) THEN
        ALTER TYPE application_status ADD VALUE 'viewing_scheduled';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'viewing_declined' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'application_status')
    ) THEN
        ALTER TYPE application_status ADD VALUE 'viewing_declined';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'viewing_completed' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'application_status')
    ) THEN
        ALTER TYPE application_status ADD VALUE 'viewing_completed';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'viewing_no_show' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'application_status')
    ) THEN
        ALTER TYPE application_status ADD VALUE 'viewing_no_show';
    END IF;
END $$;

-- Also fix viewing_requests status enum if needed
DO $$
BEGIN
    -- Add viewing status enum values
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'requested' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'viewing_status')
    ) THEN
        ALTER TYPE viewing_status ADD VALUE 'requested';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'confirmed' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'viewing_status')
    ) THEN
        ALTER TYPE viewing_status ADD VALUE 'confirmed';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'declined' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'viewing_status')
    ) THEN
        ALTER TYPE viewing_status ADD VALUE 'declined';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'completed' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'viewing_status')
    ) THEN
        ALTER TYPE viewing_status ADD VALUE 'completed';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'cancelled' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'viewing_status')
    ) THEN
        ALTER TYPE viewing_status ADD VALUE 'cancelled';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'no_show' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'viewing_status')
    ) THEN
        ALTER TYPE viewing_status ADD VALUE 'no_show';
    END IF;
END $$;

-- Verify the enum values were added
SELECT enumlabel as application_status_values 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'application_status')
ORDER BY enumlabel;

SELECT enumlabel as viewing_status_values 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'viewing_status')
ORDER BY enumlabel;
