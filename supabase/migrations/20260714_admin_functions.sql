-- Function to get summaries of all companies for admins
CREATE OR REPLACE FUNCTION public.get_companies_summary_admin()
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    owner_id UUID,
    created_at TIMESTAMPTZ,
    client_count BIGINT,
    invoice_count BIGINT,
    total_invoiced NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated and is an admin
  IF auth.jwt() ->> 'email' IN ('soninkaradigital@gmail.com', 'entrepreneur@teranga.sn', 'contact@soninkaratech.sn', 'idrissa@example.com', 'amadou@example.com', 'toureidi321@gmail.com') THEN
    RETURN QUERY 
    SELECT 
      c.id,
      c.name,
      c.email,
      c.phone,
      c.address,
      c.owner_id,
      c.created_at,
      COUNT(DISTINCT cl.id)::BIGINT as client_count,
      COUNT(DISTINCT i.id)::BIGINT as invoice_count,
      COALESCE(SUM(i.total), 0)::NUMERIC as total_invoiced
    FROM public.companies c
    LEFT JOIN public.clients cl ON cl.company_id = c.id
    LEFT JOIN public.invoices i ON i.company_id = c.id
    GROUP BY c.id, c.name, c.email, c.phone, c.address, c.owner_id, c.created_at
    ORDER BY c.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access Denied: You are not authorized to access this function.';
  END IF;
END;
$$;
