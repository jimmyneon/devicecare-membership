-- Fix RLS policies for members table to allow service role inserts

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own member record" ON members;
DROP POLICY IF EXISTS "Users can update own member record" ON members;
DROP POLICY IF EXISTS "Staff can view all members" ON members;
DROP POLICY IF EXISTS "Admins can update all members" ON members;

-- Recreate policies with INSERT support

-- Allow service role to insert (for webhook)
CREATE POLICY "Service role can insert members" ON members
    FOR INSERT 
    WITH CHECK (true);

-- Users can view their own record
CREATE POLICY "Users can view own member record" ON members
    FOR SELECT 
    USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "Users can update own member record" ON members
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Staff can view all members
CREATE POLICY "Staff can view all members" ON members
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND role IN ('STAFF', 'ADMIN')
        )
    );

-- Admins can do everything
CREATE POLICY "Admins can manage all members" ON members
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );
