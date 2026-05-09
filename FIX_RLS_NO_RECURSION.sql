-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR ⚠️
-- This fixes the infinite recursion issue in RLS policies

-- Drop ALL existing policies
DROP POLICY IF EXISTS "authenticated_insert_own" ON members;
DROP POLICY IF EXISTS "authenticated_select_own" ON members;
DROP POLICY IF EXISTS "authenticated_update_own" ON members;
DROP POLICY IF EXISTS "staff_select_all" ON members;
DROP POLICY IF EXISTS "admin_all" ON members;

-- Simple policies that don't cause recursion

-- Policy 1: Users can insert their own record
CREATE POLICY "insert_own" ON members
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy 2: Users can view their own record
CREATE POLICY "select_own" ON members
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

-- Policy 3: Users can update their own record
CREATE POLICY "update_own" ON members
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 4: Users can delete their own record
CREATE POLICY "delete_own" ON members
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = id);

-- Note: Staff/Admin access should be handled via service role or separate admin interface
-- For now, admins can use the Supabase dashboard to manage members

-- Verify policies
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'members'
ORDER BY policyname;
