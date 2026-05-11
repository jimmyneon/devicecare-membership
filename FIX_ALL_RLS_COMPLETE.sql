-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR ⚠️
-- Complete RLS fix for all member access issues

-- Step 1: Drop ALL existing policies on members table
DROP POLICY IF EXISTS "authenticated_insert_own" ON members;
DROP POLICY IF EXISTS "authenticated_select_own" ON members;
DROP POLICY IF EXISTS "authenticated_update_own" ON members;
DROP POLICY IF EXISTS "staff_select_all" ON members;
DROP POLICY IF EXISTS "admin_all" ON members;
DROP POLICY IF EXISTS "insert_own" ON members;
DROP POLICY IF EXISTS "select_own" ON members;
DROP POLICY IF EXISTS "update_own" ON members;
DROP POLICY IF EXISTS "delete_own" ON members;
DROP POLICY IF EXISTS "admin_staff_select_all" ON members;
DROP POLICY IF EXISTS "admin_update_all" ON members;

-- Step 2: Create simple, working policies

-- Policy 1: Users can insert their own record
CREATE POLICY "users_insert_own" ON members
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy 2: Users can view their own record
CREATE POLICY "users_select_own" ON members
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

-- Policy 3: ADMIN and STAFF can view ALL members
CREATE POLICY "admin_staff_select_all" ON members
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.id = auth.uid()
            AND m.role IN ('ADMIN', 'STAFF')
        )
    );

-- Policy 4: Users can update their own record
CREATE POLICY "users_update_own" ON members
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 5: ADMIN can update any member
CREATE POLICY "admin_update_all" ON members
    FOR UPDATE 
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

-- Step 3: Verify policies are created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'members'
ORDER BY policyname;

-- Step 4: Test that you can query your own member record
SELECT id, email, role, profile_completed
FROM members
WHERE id = auth.uid();
