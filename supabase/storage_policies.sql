-- Enable Storage
-- Note: You might need to enable Storage in the Supabase Dashboard first if not enabled.

-- Create bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for voices
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voices', 'voices', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to images
CREATE POLICY "Public Access Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

-- Policy: Allow authenticated users (including anonymous with session) to upload images
-- Since we handle auth via our own session/user logic, and Supabase client might be anonymous,
-- we'll allow public uploads for now, but restrict by folder or rely on app logic.
-- Ideally, we should use RLS based on auth.uid() but we are using custom session_id.
-- For simplicity in this demo, we allow anyone to insert into these buckets.
CREATE POLICY "Allow Upload Images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'images' );

-- Policy: Allow public read access to voices
CREATE POLICY "Public Access Voices"
ON storage.objects FOR SELECT
USING ( bucket_id = 'voices' );

-- Policy: Allow upload voices
CREATE POLICY "Allow Upload Voices"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'voices' );
