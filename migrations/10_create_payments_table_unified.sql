-- Create payments table as requested
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_type TEXT NOT NULL CHECK (product_type IN ('course', 'package', 'group')),
    product_id UUID NOT NULL, -- Reference to courses.id, profile.id (teacher), or groups.id
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'TRY' NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    iyzico_payment_id TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own payments" 
ON public.payments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" 
ON public.payments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
