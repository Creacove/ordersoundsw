-- Add DELETE policy for producers to delete their own beats
CREATE POLICY "Producers can delete their own beats"
ON public.beats
FOR DELETE
TO authenticated
USING (producer_id = auth.uid());
