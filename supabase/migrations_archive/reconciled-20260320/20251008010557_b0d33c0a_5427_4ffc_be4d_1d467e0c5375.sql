-- Add INSERT policy for producers to create their own beats
CREATE POLICY "Producers can insert their own beats"
ON public.beats
FOR INSERT
TO authenticated
WITH CHECK (producer_id = auth.uid());