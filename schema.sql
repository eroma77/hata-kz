-- Hata.kz Supabase DB Initialization Script
-- Copy and run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.listings (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('have_room', 'need_room')),
    owner_id TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_avatar TEXT,
    budget NUMERIC NOT NULL,
    budget_min NUMERIC,
    budget_max NUMERIC,
    age INTEGER NOT NULL,
    age_min INTEGER,
    age_max INTEGER,
    city TEXT NOT NULL,
    districts TEXT[] DEFAULT '{}',
    whatsapp TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'any')),
    occupation TEXT NOT NULL,
    room_count INTEGER,
    roommate_count INTEGER,
    total_residents INTEGER,
    residents_count INTEGER DEFAULT 1,
    gender_pref TEXT,
    description TEXT,
    photos TEXT[] DEFAULT '{}',
    address TEXT,
    gis_link TEXT,
    has_deposit BOOLEAN DEFAULT FALSE,
    has_contract BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    boost_expired_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')) NOT NULL
);

-- Index for performance optimization
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_owner_id ON public.listings(owner_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Setup RLS Access Policies
CREATE POLICY "Allow anonymous read access" ON public.listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Allow authenticated users to insert listings" ON public.listings
    FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "Allow owners to update their listings" ON public.listings
    FOR UPDATE USING (auth.uid()::text = owner_id);

CREATE POLICY "Allow owners or admins to delete/archive" ON public.listings
    FOR DELETE USING (auth.uid()::text = owner_id);

-- Migration Alter Statements for existing tables
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS age_min INTEGER;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS age_max INTEGER;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;



