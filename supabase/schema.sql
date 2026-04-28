create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  middle_name text,
  last_name text,
  phone text,
  email text,
  date_of_birth text,
  country text,
  avatar_url text,
  role text not null default 'member',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (public.is_admin() or (id = auth.uid() and role = 'member'));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert
with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', null),
    coalesce(new.raw_user_meta_data->>'last_name', null)
  )
  on conflict (id) do update set
    email = excluded.email;

  if new.email = 'admin@savewithjenny.com' then
    update public.profiles set role = 'admin' where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  currency text not null default 'NGN',
  contribution_amount numeric not null default 0,
  cycle_frequency text not null default 'monthly',
  total_cycles int not null default 6,
  invite_code text not null unique,
  cover_bucket text,
  cover_path text,
  status text not null default 'active',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
before update on public.groups
for each row
execute function public.set_updated_at();

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  position int not null default 9999,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.group_members gm
    where gm.group_id = gid and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.group_members gm
    where gm.group_id = gid and gm.user_id = auth.uid() and gm.role = 'group_admin'
  ) or public.is_admin();
$$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists groups_select_member on public.groups;
create policy groups_select_member on public.groups
for select
using (public.is_group_member(id) or created_by = auth.uid() or public.is_admin());

drop policy if exists groups_insert_self on public.groups;
create policy groups_insert_self on public.groups
for insert
with check (created_by = auth.uid());

drop policy if exists groups_update_admin on public.groups;
create policy groups_update_admin on public.groups
for update
using (public.is_group_admin(id))
with check (public.is_group_admin(id));

drop policy if exists group_members_select_member on public.group_members;
create policy group_members_select_member on public.group_members
for select
using (public.is_group_member(group_id) or public.is_admin());

drop policy if exists group_members_insert_self on public.group_members;
create policy group_members_insert_self on public.group_members
for insert
with check (user_id = auth.uid());

drop policy if exists group_members_update_admin on public.group_members;
create policy group_members_update_admin on public.group_members
for update
using (public.is_group_admin(group_id))
with check (public.is_group_admin(group_id));

create table if not exists public.payout_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bank_name text,
  account_number text,
  account_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists payout_accounts_set_updated_at on public.payout_accounts;
create trigger payout_accounts_set_updated_at
before update on public.payout_accounts
for each row
execute function public.set_updated_at();

alter table public.payout_accounts enable row level security;

drop policy if exists payout_accounts_select_own on public.payout_accounts;
create policy payout_accounts_select_own on public.payout_accounts
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists payout_accounts_upsert_own on public.payout_accounts;
create policy payout_accounts_upsert_own on public.payout_accounts
for insert
with check (user_id = auth.uid());

drop policy if exists payout_accounts_update_own on public.payout_accounts;
create policy payout_accounts_update_own on public.payout_accounts
for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create table if not exists public.personal_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  currency text not null default 'NGN',
  target_amount numeric not null default 0,
  saved_amount numeric not null default 0,
  target_date date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists personal_goals_set_updated_at on public.personal_goals;
create trigger personal_goals_set_updated_at
before update on public.personal_goals
for each row
execute function public.set_updated_at();

alter table public.personal_goals enable row level security;

drop policy if exists personal_goals_select_own on public.personal_goals;
create policy personal_goals_select_own on public.personal_goals
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists personal_goals_write_own on public.personal_goals;
create policy personal_goals_write_own on public.personal_goals
for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  personal_goal_id uuid references public.personal_goals(id) on delete set null,
  amount numeric not null,
  currency text not null default 'NGN',
  status text not null default 'pending',
  paystack_reference text,
  created_at timestamptz not null default now()
);

create unique index if not exists contributions_paystack_reference_unique
on public.contributions (paystack_reference)
where paystack_reference is not null;

create or replace function public.apply_personal_savings_payment(
  p_user_id uuid,
  p_goal_id uuid,
  p_amount numeric,
  p_currency text,
  p_reference text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_goal public.personal_goals%rowtype;
  v_new_saved numeric;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  if p_reference is null or length(p_reference) < 1 then
    raise exception 'invalid_reference';
  end if;

  select *
  into v_goal
  from public.personal_goals g
  where g.id = p_goal_id and g.user_id = p_user_id
  for update;

  if not found then
    raise exception 'goal_not_found';
  end if;

  if exists(select 1 from public.contributions c where c.paystack_reference = p_reference) then
    return;
  end if;

  insert into public.contributions (user_id, personal_goal_id, amount, currency, status, paystack_reference)
  values (p_user_id, p_goal_id, p_amount, coalesce(p_currency, 'NGN'), 'paid', p_reference);

  v_new_saved := coalesce(v_goal.saved_amount, 0) + p_amount;

  update public.personal_goals
  set
    saved_amount = v_new_saved,
    status = case when v_new_saved >= v_goal.target_amount then 'completed' else v_goal.status end
  where id = p_goal_id and user_id = p_user_id;
end;
$$;

grant execute on function public.apply_personal_savings_payment(uuid, uuid, numeric, text, text) to authenticated;

alter table public.contributions enable row level security;

drop policy if exists contributions_select_own on public.contributions;
create policy contributions_select_own on public.contributions
for select
using (
  user_id = auth.uid()
  or public.is_admin()
  or (group_id is not null and public.is_group_member(group_id))
);

drop policy if exists contributions_insert_own on public.contributions;
create policy contributions_insert_own on public.contributions
for insert
with check (user_id = auth.uid() or public.is_admin());

create table if not exists public.paystack_transactions (
  reference text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  amount_kobo bigint,
  currency text,
  status text,
  channel text,
  paid_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.paystack_transactions enable row level security;

drop policy if exists paystack_transactions_select_own on public.paystack_transactions;
create policy paystack_transactions_select_own on public.paystack_transactions
for select
using (user_id = auth.uid() or public.is_admin());

create table if not exists public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  doc_type text not null,
  file_bucket text not null,
  file_path text not null,
  created_at timestamptz not null default now()
);

alter table public.kyc_documents enable row level security;

drop policy if exists kyc_select_own on public.kyc_documents;
create policy kyc_select_own on public.kyc_documents
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists kyc_insert_own on public.kyc_documents;
create policy kyc_insert_own on public.kyc_documents
for insert
with check (user_id = auth.uid() or public.is_admin());

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.group_messages enable row level security;

drop policy if exists group_messages_select_member on public.group_messages;
create policy group_messages_select_member on public.group_messages
for select
using (public.is_group_member(group_id) or public.is_admin());

drop policy if exists group_messages_insert_member on public.group_messages;
create policy group_messages_insert_member on public.group_messages
for insert
with check (public.is_group_member(group_id) and user_id = auth.uid());

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('kyc', 'kyc', false)
on conflict (id) do nothing;
