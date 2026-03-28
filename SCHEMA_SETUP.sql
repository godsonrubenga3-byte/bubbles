-- Run this in your Supabase SQL Editor to create the profiles table

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  phone text,
  address text,
  is_whatsapp boolean default true,
  lat double precision,
  lng double precision,
  location_name text,

  constraint username_length check (char_length(username) >= 3)
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Create policies so users can only see/edit their own data
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);
