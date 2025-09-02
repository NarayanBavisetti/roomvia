# Database Setup Instructions

## Setting up States and Areas Tables in Supabase

Follow these steps to set up the required database tables:

### 1. Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** in the left sidebar
3. Click **New Query**

### 2. Run the Migration Script
1. Copy the entire contents of `database/migrations/001_create_states_and_areas.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

### 3. Verify Tables Creation
After running the script, you should see:
- `states` table with 36 Indian states/UTs
- `areas` table with sample areas for Karnataka, Maharashtra, and Delhi
- Proper indexes and foreign key relationships

### 4. Configure Environment Variables
Make sure your `.env.local` file has the correct Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 5. Test the Setup
Start your development server:
```bash
npm run dev
```

Visit your application and test the search bar:
1. State dropdown should load with Indian states
2. After selecting a state, area dropdown should populate
3. Search functionality should log selected state and area to console

## Adding More Areas
To add more areas for other states, you can run additional INSERT statements:

```sql
-- Example: Adding areas for Tamil Nadu
INSERT INTO areas (name, state_id) 
SELECT area_name, s.id 
FROM (VALUES 
  ('T. Nagar'),
  ('Adyar'),
  ('Anna Nagar'),
  ('Velachery'),
  ('OMR'),
  -- Add more areas here
) AS areas_data(area_name)
CROSS JOIN states s 
WHERE s.name = 'Tamil Nadu'
ON CONFLICT (name, state_id) DO NOTHING;
```

## Troubleshooting
- If tables already exist, the script will not recreate them
- All INSERT operations use `ON CONFLICT DO NOTHING` to prevent duplicates
- Check Supabase logs if you encounter any errors