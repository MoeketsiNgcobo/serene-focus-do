CREATE TABLE public.charts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.charts TO authenticated;
GRANT ALL ON public.charts TO service_role;
ALTER TABLE public.charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own charts" ON public.charts FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE public.collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chart_id UUID NOT NULL REFERENCES public.charts ON DELETE CASCADE,
  name TEXT NOT NULL,
  experience TEXT NOT NULL DEFAULT 'Mid',
  hourly_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collaborators TO authenticated;
GRANT ALL ON public.collaborators TO service_role;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage collaborators of own charts" ON public.collaborators FOR ALL
  USING (EXISTS (SELECT 1 FROM public.charts c WHERE c.id = chart_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.charts c WHERE c.id = chart_id AND c.owner_id = auth.uid()));

CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chart_id UUID NOT NULL REFERENCES public.charts ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage tasks of own charts" ON public.tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.charts c WHERE c.id = chart_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.charts c WHERE c.id = chart_id AND c.owner_id = auth.uid()));

CREATE TABLE public.task_assignees (
  task_id UUID NOT NULL REFERENCES public.tasks ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators ON DELETE CASCADE,
  PRIMARY KEY (task_id, collaborator_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_assignees TO authenticated;
GRANT ALL ON public.task_assignees TO service_role;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage assignees of own tasks" ON public.task_assignees FOR ALL
  USING (EXISTS (SELECT 1 FROM public.tasks t JOIN public.charts c ON c.id = t.chart_id WHERE t.id = task_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tasks t JOIN public.charts c ON c.id = t.chart_id WHERE t.id = task_id AND c.owner_id = auth.uid()));