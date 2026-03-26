-- AI 반려동물 상담 챗봇 대화 내역

create table if not exists public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null,
  user_question text not null,
  ai_answer text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_history_user_created_idx
  on public.chat_history (user_id, created_at desc);

create index if not exists chat_history_session_idx
  on public.chat_history (session_id, created_at asc);

alter table public.chat_history enable row level security;

drop policy if exists "chat_history_select_own" on public.chat_history;
drop policy if exists "chat_history_insert_own" on public.chat_history;
drop policy if exists "chat_history_delete_own" on public.chat_history;

create policy "chat_history_select_own"
  on public.chat_history for select
  to authenticated
  using (auth.uid() = user_id);

create policy "chat_history_insert_own"
  on public.chat_history for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "chat_history_delete_own"
  on public.chat_history for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.chat_history to authenticated;
