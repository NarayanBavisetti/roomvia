-- Fresh Supabase schema with structured location fields
-- Run this after dropping and recreating the database

-- Create the listings table with structured location fields
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('normal', 'broker')),
  title TEXT NOT NULL,
  property_type TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  area_sqft INTEGER,
  floor INTEGER,
  description TEXT,
  highlights TEXT[] DEFAULT '{}',
  rent INTEGER NOT NULL,
  maintenance INTEGER DEFAULT 0,
  security_deposit INTEGER NOT NULL,
  expenses TEXT,
  flatmate_preferences JSONB DEFAULT '{}',
  contact_number TEXT NOT NULL,
  images JSONB DEFAULT '[]', -- Updated to store Cloudinary image objects
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'rented')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the flatmates table
CREATE TABLE flatmates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  occupation TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  budget_min INTEGER,
  budget_max INTEGER,
  preferences JSONB DEFAULT '{}',
  about TEXT,
  contact_number TEXT,
  images JSONB DEFAULT '[]',
  looking_for TEXT[] DEFAULT '{}',
  move_in_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'found')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  user_type TEXT DEFAULT 'normal' CHECK (user_type IN ('normal', 'broker')),
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the saves table (for saved listings/flatmates)
CREATE TABLE saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('listing', 'flatmate')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- Create the chats table
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  flatmate_id UUID REFERENCES flatmates(id) ON DELETE CASCADE,
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_one_reference CHECK (
    (listing_id IS NOT NULL AND flatmate_id IS NULL) OR
    (listing_id IS NULL AND flatmate_id IS NOT NULL)
  )
);

-- Create the messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- No sample data - all data will come from user submissions through the application

-- Create indexes for better performance
CREATE INDEX idx_listings_property_type ON listings(property_type);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_state ON listings(state);
CREATE INDEX idx_listings_country ON listings(country);
CREATE INDEX idx_listings_location_combined ON listings(city, state, country);
CREATE INDEX idx_listings_rent ON listings(rent);
CREATE INDEX idx_listings_created_at ON listings(created_at);
CREATE INDEX idx_listings_user_type ON listings(user_type);
CREATE INDEX idx_listings_status ON listings(status);

CREATE INDEX idx_flatmates_city ON flatmates(city);
CREATE INDEX idx_flatmates_state ON flatmates(state);
CREATE INDEX idx_flatmates_country ON flatmates(country);
CREATE INDEX idx_flatmates_location_combined ON flatmates(city, state, country);
CREATE INDEX idx_flatmates_budget_min ON flatmates(budget_min);
CREATE INDEX idx_flatmates_budget_max ON flatmates(budget_max);
CREATE INDEX idx_flatmates_gender ON flatmates(gender);
CREATE INDEX idx_flatmates_created_at ON flatmates(created_at);
CREATE INDEX idx_flatmates_status ON flatmates(status);

CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_state ON profiles(state);

CREATE INDEX idx_saves_user_id ON saves(user_id);
CREATE INDEX idx_saves_item_type ON saves(item_type);
CREATE INDEX idx_saves_created_at ON saves(created_at);

CREATE INDEX idx_chats_listing_id ON chats(listing_id);
CREATE INDEX idx_chats_flatmate_id ON chats(flatmate_id);
CREATE INDEX idx_chats_user1_id ON chats(user1_id);
CREATE INDEX idx_chats_user2_id ON chats(user2_id);
CREATE INDEX idx_chats_last_message_at ON chats(last_message_at);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE flatmates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for listings
CREATE POLICY "Listings are viewable by everyone" ON listings FOR SELECT USING (true);
CREATE POLICY "Users can insert their own listings" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own listings" ON listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own listings" ON listings FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for flatmates  
CREATE POLICY "Flatmates are viewable by everyone" ON flatmates FOR SELECT USING (true);
CREATE POLICY "Users can insert their own flatmate profiles" ON flatmates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flatmate profiles" ON flatmates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flatmate profiles" ON flatmates FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for saves
CREATE POLICY "Users can view their own saves" ON saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saves" ON saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saves" ON saves FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for chats
CREATE POLICY "Users can view their own chats" ON chats FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can insert chats they participate in" ON chats FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can update their own chats" ON chats FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in their chats" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid()))
);
CREATE POLICY "Users can insert messages in their chats" ON messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid()))
  AND auth.uid() = sender_id
);
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);

-- Create triggers for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flatmates_updated_at BEFORE UPDATE ON flatmates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();