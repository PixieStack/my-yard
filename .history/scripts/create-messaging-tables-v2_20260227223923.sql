-- Create conversations table (for lease-based chat threads)
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  lease_id uuid not null references public.leases(id) on delete cascade,
  tenant_id uuid not null references auth.users(id) on delete cascade,
  landlord_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Ensure one conversation per lease
  unique(lease_id)
);

-- Create messages table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now(),
  read_at timestamp with time zone,
  
  -- Index for faster queries
  constraint messages_sender_check check (sender_id in (
    select tenant_id from public.conversations where id = conversation_id
    union
    select landlord_id from public.conversations where id = conversation_id
  ))
);

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversation policies - users can only see conversations they're part of
create policy "Users can view their conversations"
  on public.conversations for select
  using (auth.uid() = tenant_id or auth.uid() = landlord_id);

create policy "Conversations are created automatically with leases"
  on public.conversations for insert
  with check (auth.uid() = tenant_id or auth.uid() = landlord_id);

-- Message policies - users can only see and send messages in their conversations
create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    conversation_id in (
      select id from public.conversations 
      where auth.uid() = tenant_id or auth.uid() = landlord_id
    )
  );

create policy "Users can send messages in their conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    conversation_id in (
      select id from public.conversations 
      where auth.uid() = tenant_id or auth.uid() = landlord_id
    )
  );

-- Grant permissions
grant select, insert, update on public.conversations to anon, authenticated;
grant select, insert on public.messages to anon, authenticated;
grant usage, select on sequence public.conversations_id_seq to anon, authenticated;
grant usage, select on sequence public.messages_id_seq to anon, authenticated;

-- Create index for faster queries
create index if not exists idx_conversations_lease_id on public.conversations(lease_id);
create index if not exists idx_conversations_users on public.conversations(tenant_id, landlord_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_created_at on public.messages(created_at);
