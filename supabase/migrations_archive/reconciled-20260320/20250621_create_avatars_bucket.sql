
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Create policy to allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Create policy to allow public read access to avatars
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Create policy to allow users to update their own avatars
CREATE POLICY "Users can update own avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Create policy to allow users to delete their own avatars
CREATE POLICY "Users can delete own avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
