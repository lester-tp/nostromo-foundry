-- ============================================================
-- Nostromo Foundry — esquema de ingesta de contribuidores
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

create table public.contributors (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  country text,
  phone_whatsapp text,
  payout_method text,
  payout_account text,
  created_at timestamptz default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  instructions text not null,
  camera_protocol text,
  min_duration_s int default 5,
  max_duration_s int default 300,
  min_resolution text default '1280x720',
  requires_audio boolean default false,
  pay_per_accepted_usd numeric(6,2) not null,
  status text default 'open' check (status in ('open','paused','closed')),
  created_at timestamptz default now()
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  ep_code text unique,
  contributor_id uuid not null references public.contributors(id),
  task_id uuid not null references public.tasks(id),
  storage_key text not null,
  file_name text,
  file_size_bytes bigint,
  content_type text,
  status text default 'uploaded' check (status in
    ('uploaded','auto_checked','rejected_auto','in_qa','accepted','rejected','paid')),
  modality text[],
  auto_qa jsonb,
  reject_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create sequence public.ep_seq start 147;
create or replace function public.assign_ep_code() returns trigger as $$
begin
  new.ep_code := 'EP-' || lpad(nextval('public.ep_seq')::text, 4, '0');
  return new;
end; $$ language plpgsql;
create trigger trg_ep_code before insert on public.episodes
  for each row execute function public.assign_ep_code();

create table public.qa_events (
  id bigint generated always as identity primary key,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  actor text not null,
  action text not null,
  detail jsonb,
  created_at timestamptz default now()
);

-- RLS
alter table public.contributors enable row level security;
alter table public.tasks enable row level security;
alter table public.episodes enable row level security;
alter table public.qa_events enable row level security;

create policy "own profile" on public.contributors
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "tasks visible" on public.tasks
  for select using (auth.role() = 'authenticated' and status = 'open');
create policy "own episodes read" on public.episodes
  for select using (auth.uid() = contributor_id);
create policy "own episodes insert" on public.episodes
  for insert with check (auth.uid() = contributor_id);
create policy "own qa read" on public.qa_events
  for select using (exists (
    select 1 from public.episodes e
    where e.id = episode_id and e.contributor_id = auth.uid()));

create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.contributors (id) values (new.id) on conflict do nothing;
  return new;
end; $$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.tasks (slug,title,instructions,camera_protocol,requires_audio,pay_per_accepted_usd)
values ('fold_towel','Doblar una toalla',
 'Graba en primera persona doblando una toalla sobre una mesa. Un intento por video. Antes de empezar, di en voz alta: "fold the towel in half".',
 'Camara a la altura del pecho, manos siempre visibles, luz natural, 1080p.',
 true, 4.50);
