create extension if not exists pgcrypto;

create table if not exists public.chess_rooms(
  id uuid primary key default gen_random_uuid(),
  white_id uuid not null,
  black_id uuid,
  fen text not null default 'startpos',
  turn text not null default 'w' check (turn in ('w','b')),
  status text not null default 'waiting' check (status in ('waiting','playing','finished','abandoned')),
  winner text check (winner in ('w','b','draw') or winner is null),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chess_rooms enable row level security;

drop policy if exists "chess rooms read" on public.chess_rooms;
drop policy if exists "chess rooms insert" on public.chess_rooms;
drop policy if exists "chess rooms update" on public.chess_rooms;

create policy "chess rooms read"
on public.chess_rooms for select
to authenticated
using (auth.uid() = white_id or auth.uid() = black_id);

create policy "chess rooms insert"
on public.chess_rooms for insert
to authenticated
with check (auth.uid() = white_id and black_id is null and status = 'waiting');

create policy "chess rooms update"
on public.chess_rooms for update
to authenticated
using (auth.uid() = white_id or auth.uid() = black_id)
with check (auth.uid() = white_id or auth.uid() = black_id);

create or replace function public.set_chess_room_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chess_rooms_updated_at on public.chess_rooms;
create trigger chess_rooms_updated_at
before update on public.chess_rooms
for each row execute function public.set_chess_room_updated_at();

do $$
begin
  alter publication supabase_realtime add table public.chess_rooms;
exception
  when duplicate_object then null;
end $$;
