-- Create favorites table
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamp with time zone default now(),
  
  -- Ensure no duplicate favorites
  unique(user_id, property_id)
);

-- Add RLS policies
alter table public.favorites enable row level security;

-- Users can only see their own favorites
create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

-- Users can only insert their own favorites
create policy "Users can create their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

-- Users can only delete their own favorites
create policy "Users can delete their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- Grant permissions
grant select, insert, delete on public.favorites to anon, authenticated;
grant usage, select on sequence public.favorites_id_seq to anon, authenticated;
