-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR ⚠️
-- This creates the storage bucket and RLS policies for profile photos

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photo" ON storage.objects;

-- Policy 1: Allow users to upload their own profile photo
-- File name pattern: {user-id}-{timestamp}.{ext}
CREATE POLICY "Users can upload own profile photo" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile-photos' 
        AND name LIKE auth.uid()::text || '-%'
    );

-- Policy 2: Allow users to update their own profile photo
CREATE POLICY "Users can update own profile photo" ON storage.objects
    FOR UPDATE 
    TO authenticated
    USING (
        bucket_id = 'profile-photos' 
        AND name LIKE auth.uid()::text || '-%'
    );

-- Policy 3: Allow anyone to view profile photos (public bucket)
CREATE POLICY "Anyone can view profile photos" ON storage.objects
    FOR SELECT 
    TO public
    USING (bucket_id = 'profile-photos');

-- Policy 4: Allow users to delete their own profile photo
CREATE POLICY "Users can delete own profile photo" ON storage.objects
    FOR DELETE 
    TO authenticated
    USING (
        bucket_id = 'profile-photos' 
        AND name LIKE auth.uid()::text || '-%'
    );

-- Verify the bucket and policies
SELECT * FROM storage.buckets WHERE id = 'profile-photos';

SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%profile%'
ORDER BY policyname;
