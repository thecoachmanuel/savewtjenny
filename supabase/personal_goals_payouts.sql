-- Personal goals payouts table
create table if not exists public.personal_goals_payouts (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.personal_goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'NGN',
  status text not null default 'pending', -- pending, processing, completed, failed
  initiated_by uuid references public.profiles(id) on delete set null,
  initiated_at timestamptz not null default now(),
  processed_at timestamptz,
  failure_reason text,
  reference text
);

alter table public.personal_goals_payouts enable row level security;

-- RLS policies for personal goals payouts
drop policy if exists personal_goals_payouts_admin on public.personal_goals_payouts;
create policy personal_goals_payouts_admin on public.personal_goals_payouts
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists personal_goals_payouts_select_user on public.personal_goals_payouts;
create policy personal_goals_payouts_select_user on public.personal_goals_payouts
for select
using (user_id = auth.uid() or public.is_admin());