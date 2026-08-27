-- Add is_demo column to news table
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Mark all existing news as demo
UPDATE public.news SET is_demo = true WHERE is_demo = false;
