create extension if not exists pgcrypto;
create table if not exists public.chess_rooms(id uuid primary key default gen_random_uuid(),white_id uuid,black_id uuid,fen text not null,turn text not null,status text not null default 'waiting',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.chess_rooms enable row level security;
create policy "chess rooms read" on public.chess_rooms for select using (true);
create policy "chess rooms insert" on public.chess_rooms for insert with check (true);
create policy "chess rooms update" on public.chess_rooms for update using (true) with check (true);
alter publication supabase_realtime add table public.chess_rooms;
