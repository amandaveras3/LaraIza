-- Lara Iza / Supabase production schema
-- Run this entire file in Supabase SQL Editor before publishing.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'Administrador',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Lara Iza',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','manager','employee','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.app_state (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  subject text not null,
  message text not null,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_members m where m.organization_id = target_org and m.user_id = auth.uid());
$$;

create or replace function public.ensure_my_organization()
returns uuid language plpgsql security definer set search_path = public as $$
declare
  org_id uuid;
  user_name text;
begin
  select organization_id into org_id from public.organization_members where user_id = auth.uid() order by created_at limit 1;
  if org_id is not null then return org_id; end if;
  select coalesce(raw_user_meta_data->>'full_name', email, 'Usuário') into user_name from auth.users where id = auth.uid();
  insert into public.profiles (id, full_name) values (auth.uid(), user_name) on conflict (id) do update set full_name=excluded.full_name, updated_at=now();
  insert into public.organizations (name, created_by) values ('Lara Iza', auth.uid()) returning id into org_id;
  insert into public.organization_members (organization_id, user_id, role) values (org_id, auth.uid(), 'owner');
  insert into public.app_state (organization_id, state, updated_by) values (org_id, jsonb_build_object('schemaVersion', 1), auth.uid());
  return org_id;
end; $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists organizations_touch on public.organizations;
create trigger organizations_touch before update on public.organizations for each row execute function public.touch_updated_at();
drop trigger if exists app_state_touch on public.app_state;
create trigger app_state_touch before update on public.app_state for each row execute function public.touch_updated_at();
drop trigger if exists support_touch on public.support_tickets;
create trigger support_touch before update on public.support_tickets for each row execute function public.touch_updated_at();

create or replace function public.log_state_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log(organization_id,user_id,action,entity,metadata)
  values(new.organization_id, auth.uid(), 'state_updated', 'app_state', jsonb_build_object('version',new.version));
  return new;
end; $$;

drop trigger if exists app_state_audit on public.app_state;
create trigger app_state_audit after update on public.app_state for each row execute function public.log_state_change();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.app_state enable row level security;
alter table public.audit_log enable row level security;
alter table public.support_tickets enable row level security;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all using (id=auth.uid()) with check (id=auth.uid());
drop policy if exists org_member_read on public.organizations;
create policy org_member_read on public.organizations for select using (public.is_org_member(id));
drop policy if exists org_member_read_members on public.organization_members;
create policy org_member_read_members on public.organization_members for select using (public.is_org_member(organization_id));
drop policy if exists app_state_member on public.app_state;
create policy app_state_member on public.app_state for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
drop policy if exists audit_member on public.audit_log;
create policy audit_member on public.audit_log for select using (public.is_org_member(organization_id));
drop policy if exists support_member on public.support_tickets;
create policy support_member on public.support_tickets for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id) and user_id=auth.uid());

grant execute on function public.ensure_my_organization() to authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select on public.organizations, public.organization_members, public.audit_log to authenticated;
grant select,insert,update on public.app_state to authenticated;
grant select,insert,update on public.support_tickets to authenticated;
