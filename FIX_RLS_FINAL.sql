-- ⚠️ FINAL FIX - RUN THIS IN SUPABASE SQL EDITOR ⚠️

-- First, let's see what's currently there
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'members';

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Service role can insert members" ON members;
DROP POLICY IF EXISTS "Users can view own member record" ON members;
DROP POLICY IF EXISTS "Users can update own member record" ON members;
DROP POLICY IF EXISTS "Staff can view all members" ON members;
DROP POLICY IF EXISTS "Admins can manage all members" ON members;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON members;
DROP POLICY IF EXISTS "Prevent anonymous access" ON members;

-- Policy 1: Allow INSERT for authenticated users (when webhook creates them)
CREATE POLICY "authenticated_insert_own" ON members
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy 2: Allow SELECT for own record
CREATE POLICY "authenticated_select_own" ON members
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

-- Policy 3: Allow UPDATE for own record
CREATE POLICY "authenticated_update_own" ON members
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 4: Staff can view all
CREATE POLICY "staff_select_all" ON members
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.id = auth.uid() 
            AND m.role IN ('STAFF', 'ADMIN')
        )
    );

-- Policy 5: Admins can do everything
CREATE POLICY "admin_all" ON members
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.id = auth.uid() 
            AND m.role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.id = auth.uid() 
            AND m.role = 'ADMIN'
        )
    );

-- Verify new policies
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'members'
ORDER BY policyname;
