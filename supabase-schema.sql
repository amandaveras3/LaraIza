-- Lara Iza — schema de produção
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'employee' check (role in ('owner','admin','manager','employee','viewer')),
  phone text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists photo_url text;
alter table public.profiles add column if not exists role text not null default 'employee';

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
  role text not null default 'employee' check (role in ('owner','admin','manager','employee','viewer')),
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

create table if not exists public.support_ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.role_for_email(target_email text)
returns text language sql immutable as $$
  select case lower(trim(coalesce(target_email,'')))
    when 'saulo@laraiza.com' then 'admin'
    when 'amanda@laraiza.com' then 'admin'
    when 'eduardo@laraiza.com' then 'manager'
    when 'vitoria@laraiza.com' then 'manager'
    when 'maria@laraiza.com' then 'employee'
    else 'employee'
  end;
$$;

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  );
$$;

create or replace function public.ensure_my_organization()
returns uuid language plpgsql security definer set search_path = public as $$
declare
  org_id uuid;
  user_name text;
  user_email text;
  desired_role text;
begin
  select email, coalesce(raw_user_meta_data->>'full_name','')
    into user_email, user_name
    from auth.users where id = auth.uid();

  desired_role := public.role_for_email(user_email);
  if user_name = '' then user_name := initcap(split_part(coalesce(user_email,'Usuário'),'@',1)); end if;

  select organization_id into org_id
    from public.organization_members
    where user_id = auth.uid()
    order by created_at limit 1;

  if org_id is null then
    select id into org_id from public.organizations
      where name = 'Lara Iza' order by created_at limit 1;
  end if;

  if org_id is null then
    insert into public.organizations(name, created_by)
    values ('Lara Iza', auth.uid())
    returning id into org_id;

    insert into public.app_state(organization_id,state,updated_by)
    values (org_id, jsonb_build_object('schemaVersion',3,'categories',jsonb_build_array(),'products',jsonb_build_array(),'suppliers',jsonb_build_array(),'customers',jsonb_build_array(),'movements',jsonb_build_array(),'supportTickets',jsonb_build_array(),'alerts',jsonb_build_array(),'settings',jsonb_build_object('lowStockThreshold',5)),auth.uid());
  end if;

  insert into public.profiles(id,full_name,role)
  values(auth.uid(),user_name,desired_role)
  on conflict(id) do update set
    full_name=case when excluded.full_name <> '' then excluded.full_name else profiles.full_name end,
    role=desired_role,
    updated_at=now();

  insert into public.organization_members(organization_id,user_id,role)
  values(org_id,auth.uid(),desired_role)
  on conflict(organization_id,user_id) do update set role=excluded.role;

  return org_id;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists organizations_touch on public.organizations;
create trigger organizations_touch before update on public.organizations for each row execute function public.touch_updated_at();
drop trigger if exists app_state_touch on public.app_state;
create trigger app_state_touch before update on public.app_state for each row execute function public.touch_updated_at();
drop trigger if exists support_touch on public.support_tickets;
create trigger support_touch before update on public.support_tickets for each row execute function public.touch_updated_at();
drop trigger if exists alerts_touch on public.alerts;
create trigger alerts_touch before update on public.alerts for each row execute function public.touch_updated_at();

create or replace function public.log_state_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log(organization_id,user_id,action,entity,metadata)
  values(new.organization_id,auth.uid(),'state_updated','app_state',jsonb_build_object('version',new.version));
  return new;
end;
$$;

drop trigger if exists app_state_audit on public.app_state;
create trigger app_state_audit after update on public.app_state for each row execute function public.log_state_change();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.app_state enable row level security;
alter table public.audit_log enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_replies enable row level security;
alter table public.alerts enable row level security;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all using(id=auth.uid()) with check(id=auth.uid());

drop policy if exists org_member_read on public.organizations;
create policy org_member_read on public.organizations for select using(public.is_org_member(id));

drop policy if exists org_member_read_members on public.organization_members;
create policy org_member_read_members on public.organization_members for select using(public.is_org_member(organization_id));

drop policy if exists app_state_member on public.app_state;
create policy app_state_member on public.app_state for all using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));

drop policy if exists audit_member on public.audit_log;
create policy audit_member on public.audit_log for select using(public.is_org_member(organization_id));

drop policy if exists support_member_read on public.support_tickets;
create policy support_member_read on public.support_tickets for select using(public.is_org_member(organization_id));
drop policy if exists support_admin_insert on public.support_tickets;
create policy support_admin_insert on public.support_tickets for insert with check(public.is_org_admin(organization_id) and user_id=auth.uid());
drop policy if exists support_member_update on public.support_tickets;
create policy support_member_update on public.support_tickets for update using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));

drop policy if exists replies_member_read on public.support_ticket_replies;
create policy replies_member_read on public.support_ticket_replies for select using(
  exists(select 1 from public.support_tickets t where t.id=ticket_id and public.is_org_member(t.organization_id))
);
drop policy if exists replies_member_insert on public.support_ticket_replies;
create policy replies_member_insert on public.support_ticket_replies for insert with check(
  user_id=auth.uid() and exists(select 1 from public.support_tickets t where t.id=ticket_id and public.is_org_member(t.organization_id))
);

drop policy if exists alerts_member_read on public.alerts;
create policy alerts_member_read on public.alerts for select using(public.is_org_member(organization_id));
drop policy if exists alerts_admin_insert on public.alerts;
create policy alerts_admin_insert on public.alerts for insert with check(public.is_org_admin(organization_id) and created_by=auth.uid());
drop policy if exists alerts_member_update on public.alerts;
create policy alerts_member_update on public.alerts for update using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));

grant execute on function public.ensure_my_organization() to authenticated;
grant execute on function public.role_for_email(text) to authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select on public.organizations,public.organization_members,public.audit_log to authenticated;
grant select,insert,update on public.app_state to authenticated;
grant select,update on public.support_tickets to authenticated;
grant insert,select on public.support_tickets to authenticated;
grant select,insert on public.support_ticket_replies to authenticated;
grant select,insert,update on public.alerts to authenticated;
