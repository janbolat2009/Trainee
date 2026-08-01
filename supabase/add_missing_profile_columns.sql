-- SQL для Supabase SQL Editor
-- Добавляет недостающие поля в таблицу profiles

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS secondary_sports text[],
ADD COLUMN IF NOT EXISTS years_experience integer,
ADD COLUMN IF NOT EXISTS goals text[],
ADD COLUMN IF NOT EXISTS coaching_style text,
ADD COLUMN IF NOT EXISTS languages_spoken text[],
ADD COLUMN IF NOT EXISTS availability text,
ADD COLUMN IF NOT EXISTS time_zone text,
ADD COLUMN IF NOT EXISTS specialization text,
ADD COLUMN IF NOT EXISTS contact_number text,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Если у вас уже есть поле 'specializtion' с опечаткой, можно переименовать его в specialization
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'specializtion'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'specialization'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN specializtion TO specialization;
  END IF;
END $$;

-- При желании можно сделать avatar публичным через storage bucket
-- 1. В Supabase Dashboard → Storage → Create bucket "avatars"
-- 2. Set bucket to public
