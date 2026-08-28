-- Adjust default settings values for the initial project to match spec
UPDATE public.settings
SET max_posts_per_day = 10,
    minimum_confidence = 80
WHERE project_id = (SELECT id FROM public.projects WHERE name = 'Projeto Notícias Laguna' LIMIT 1);

-- Also update the column defaults for future inserts
ALTER TABLE public.settings ALTER COLUMN max_posts_per_day SET DEFAULT 10;
ALTER TABLE public.settings ALTER COLUMN minimum_confidence SET DEFAULT 80;

-- Allow url to be nullable in sources (spec says TEXT without NOT NULL)
ALTER TABLE public.sources ALTER COLUMN url DROP NOT NULL;
