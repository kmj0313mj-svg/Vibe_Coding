-- 사용자/반려동물 관리 확장
-- auth.users: 이메일/비밀번호 저장
-- public.profiles: 가입일, 알림 설정
-- public.pets: 사용자 소유 반려동물 (1:N)

alter table public.profiles add column if not exists notification_enabled boolean not null default false;
alter table public.profiles add column if not exists notification_email text;
alter table public.profiles add column if not exists notification_delay_seconds integer not null default 30;

update public.profiles
set notification_email = coalesce(notification_email, email),
    notification_delay_seconds = coalesce(notification_delay_seconds, 30),
    updated_at = now();

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default '',
  species text not null default 'other',
  age integer,
  traits text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pets_age_non_negative check (age is null or age >= 0),
  constraint pets_species_valid check (species in ('dog', 'cat', 'other'))
);

create unique index if not exists pets_one_primary_per_owner_idx
  on public.pets (owner_id)
  where is_primary = true;

alter table public.pets enable row level security;

drop policy if exists "pets_select_own" on public.pets;
drop policy if exists "pets_insert_own" on public.pets;
drop policy if exists "pets_update_own" on public.pets;
drop policy if exists "pets_delete_own" on public.pets;

create policy "pets_select_own"
  on public.pets for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "pets_insert_own"
  on public.pets for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "pets_update_own"
  on public.pets for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "pets_delete_own"
  on public.pets for delete
  to authenticated
  using (auth.uid() = owner_id);

grant select, insert, update, delete on public.pets to authenticated;
grant select, insert, update on public.profiles to authenticated;
