CREATE TABLE public.workforce_settings (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  global_context text NOT NULL DEFAULT '',
  engine text NOT NULL DEFAULT 'mock',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workforce_settings TO authenticated;
GRANT ALL ON public.workforce_settings TO service_role;

ALTER TABLE public.workforce_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workforce settings"
  ON public.workforce_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_workforce_settings_updated_at
  BEFORE UPDATE ON public.workforce_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();