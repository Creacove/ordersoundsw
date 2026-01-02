-- Drop the constraint if it exists (might be invalid/broken)
ALTER TABLE public.soundpacks 
DROP CONSTRAINT IF EXISTS soundpacks_producer_id_fkey;

-- Now add it properly
ALTER TABLE public.soundpacks 
ADD CONSTRAINT soundpacks_producer_id_fkey 
FOREIGN KEY (producer_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;