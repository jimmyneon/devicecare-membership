-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR ⚠️
-- This completely fixes the RLS issue by allowing authenticated inserts

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Service role can insert members" ON members;

-- Create a new policy that allows inserts for authenticated users
-- This is needed because when the webhook creates a user, they're immediately authenticated
CREATE POLICY "Allow authenticated inserts" ON members
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Also ensure anon can't do anything
CREATE POLICY "Prevent anonymous access" ON members
    FOR ALL
    TO anon
    USING (false);

-- Verify the policies
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'members'
ORDER BY cmd, policyname;
