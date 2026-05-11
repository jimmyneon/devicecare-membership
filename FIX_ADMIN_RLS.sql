-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR ⚠️
-- This adds RLS policies for ADMIN and STAFF to view all members

-- Add policy for ADMIN and STAFF to view all members
CREATE POLICY "admin_staff_select_all" ON members
    FOR SELECT 
    TO authenticated
    USING (
        -- Allow if user is ADMIN or STAFF
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.id = auth.uid()
            AND m.role IN ('ADMIN', 'STAFF')
        )
    );

-- Add policy for ADMIN to update any member
CREATE POLICY "admin_update_all" ON members
    FOR UPDATE 
    TO authenticated
    USING (
        -- Allow if user is ADMIN
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

-- Verify all policies
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'members'
ORDER BY policyname;
