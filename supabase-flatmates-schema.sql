-- Create the flatmates table (idempotent-friendly for fresh setups)
CREATE TABLE IF NOT EXISTS flatmates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  company TEXT NOT NULL,
  budget_min INTEGER NOT NULL,
  budget_max INTEGER NOT NULL,
  non_smoker BOOLEAN DEFAULT true,
  food_preference TEXT NOT NULL CHECK (food_preference IN ('Veg', 'Non-Veg', 'Vegan')),
  gated_community BOOLEAN DEFAULT false,
  city TEXT,
  state TEXT,
  amenities TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required columns exist for existing databases
ALTER TABLE flatmates ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE flatmates ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE flatmates ADD CONSTRAINT flatmates_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE flatmates ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE flatmates ADD COLUMN IF NOT EXISTS state TEXT;

-- One profile per user (optional but recommended)
CREATE UNIQUE INDEX IF NOT EXISTS flatmates_user_unique ON flatmates(user_id);

-- Enable RLS and add policies to allow users to manage their own profile
ALTER TABLE flatmates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'flatmates_select_own') THEN
    CREATE POLICY flatmates_select_own ON flatmates
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'flatmates_insert_own') THEN
    CREATE POLICY flatmates_insert_own ON flatmates
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'flatmates_update_own') THEN
    CREATE POLICY flatmates_update_own ON flatmates
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'flatmates_delete_own') THEN
    CREATE POLICY flatmates_delete_own ON flatmates
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;