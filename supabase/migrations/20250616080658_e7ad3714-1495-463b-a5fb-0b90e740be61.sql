
-- Create the carts table
CREATE TABLE public.carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For guest carts
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the cart_items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
  beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
  license_type TEXT NOT NULL DEFAULT 'basic',
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cart_id, beat_id) -- Prevent duplicate beats in same cart
);

-- Add Row Level Security (RLS)
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for carts
CREATE POLICY "Users can view their own carts" 
  ON public.carts 
  FOR SELECT 
  USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Users can create their own carts" 
  ON public.carts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Users can update their own carts" 
  ON public.carts 
  FOR UPDATE 
  USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Users can delete their own carts" 
  ON public.carts 
  FOR DELETE 
  USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

-- RLS policies for cart_items
CREATE POLICY "Users can view their own cart items" 
  ON public.cart_items 
  FOR SELECT 
  USING (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE auth.uid() = user_id OR session_id = current_setting('app.session_id', true)
    )
  );

CREATE POLICY "Users can create their own cart items" 
  ON public.cart_items 
  FOR INSERT 
  WITH CHECK (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE auth.uid() = user_id OR session_id = current_setting('app.session_id', true)
    )
  );

CREATE POLICY "Users can update their own cart items" 
  ON public.cart_items 
  FOR UPDATE 
  USING (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE auth.uid() = user_id OR session_id = current_setting('app.session_id', true)
    )
  );

CREATE POLICY "Users can delete their own cart items" 
  ON public.cart_items 
  FOR DELETE 
  USING (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE auth.uid() = user_id OR session_id = current_setting('app.session_id', true)
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_carts_user_id ON public.carts(user_id);
CREATE INDEX idx_carts_session_id ON public.carts(session_id);
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_beat_id ON public.cart_items(beat_id);

-- Create function to automatically update cart updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.carts 
  SET updated_at = now() 
  WHERE id = COALESCE(NEW.cart_id, OLD.cart_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update cart timestamp when items change
CREATE TRIGGER update_cart_timestamp
  AFTER INSERT OR UPDATE OR DELETE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_updated_at();

-- Enable realtime for cart updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.carts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;
;
