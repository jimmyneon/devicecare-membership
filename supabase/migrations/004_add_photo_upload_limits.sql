-- Add photo upload tracking to prevent abuse
-- Members can only change their photo a limited number of times

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS profile_photo_upload_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_photo_upload_at TIMESTAMPTZ;

COMMENT ON COLUMN members.profile_photo_upload_count IS 'Number of times member has uploaded/changed their profile photo';
COMMENT ON COLUMN members.last_photo_upload_at IS 'Timestamp of last photo upload';

-- Create function to check if photo upload is allowed
CREATE OR REPLACE FUNCTION can_upload_profile_photo(p_member_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_upload_count INTEGER;
    v_role user_role;
BEGIN
    -- Get member's upload count and role
    SELECT profile_photo_upload_count, role
    INTO v_upload_count, v_role
    FROM members
    WHERE id = p_member_id;
    
    -- Staff and admins have unlimited uploads
    IF v_role IN ('STAFF', 'ADMIN') THEN
        RETURN TRUE;
    END IF;
    
    -- Customers limited to 5 uploads total
    -- This prevents constant photo changes and abuse
    IF v_upload_count >= 5 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_upload_profile_photo IS 'Check if member is allowed to upload/change profile photo (limit 5 for customers)';
