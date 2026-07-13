-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage expenses for their companies
CREATE POLICY "Users can manage expenses belonging to their companies" ON public.expenses
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE public.companies.id = public.expenses.company_id 
            AND public.companies.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE public.companies.id = public.expenses.company_id 
            AND public.companies.owner_id = auth.uid()
        )
    );
