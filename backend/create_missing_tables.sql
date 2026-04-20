-- 1. Applications Table (Add missing columns to existing table)
ALTER TABLE IF EXISTS public.applications 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50) DEFAULT 'initiation',
    ADD COLUMN IF NOT EXISTS cert_status VARCHAR(50) DEFAULT 'Not Ready',
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Ensure Unique constraint on user_id if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_user_id_key') THEN
        ALTER TABLE public.applications ADD CONSTRAINT applications_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 2. Department Status Table
CREATE TABLE IF NOT EXISTS public.department_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    department VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    authority VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pending',
    flag_reason TEXT,
    cleared_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT now(),
    UNIQUE(application_id, department)
);

-- 3. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    doc_type VARCHAR(100),
    file_path TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    certificate_id VARCHAR(100) UNIQUE,
    file_path TEXT,
    issued_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 5. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2),
    department VARCHAR(50),
    transaction_id VARCHAR(255),
    receipt_no VARCHAR(100) UNIQUE,
    receipt_path TEXT,
    status VARCHAR(50) DEFAULT 'Captured',
    paid_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
