-- ============================================================
-- FlowMind AI — Billing + Team Workspaces migration
-- Run this in the Supabase SQL editor
-- ============================================================

-- ── Subscriptions ─────────────────────────────────────────────
create table if not exists subscriptions (
  user_id              uuid primary key references auth.users on delete cascade,
  stripe_customer_id   text unique,
  stripe_subscription_id text unique,
  plan                 text not null default 'free',     -- 'free' | 'pro' | 'business'
  status               text not null default 'active',   -- 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "Users read own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Service-role can write (webhook handler runs with service role)
create policy "Service role manages subscriptions"
  on subscriptions for all
  using (auth.role() = 'service_role');


-- ── Workspaces ────────────────────────────────────────────────
create table if not exists workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

alter table workspaces enable row level security;

-- Members of a workspace can see it
create policy "Workspace members can view workspace"
  on workspaces for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from workspace_members
      where workspace_members.workspace_id = id
        and workspace_members.user_id = auth.uid()
    )
  );

create policy "Owners can insert workspaces"
  on workspaces for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update workspaces"
  on workspaces for update
  using (auth.uid() = owner_id);

create policy "Owners can delete workspaces"
  on workspaces for delete
  using (auth.uid() = owner_id);


-- ── Workspace members ─────────────────────────────────────────
create table if not exists workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  role         text not null default 'editor',  -- 'owner' | 'editor' | 'viewer'
  joined_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);

alter table workspace_members enable row level security;

create policy "Members can view workspace members"
  on workspace_members for select
  using (
    exists (
      select 1 from workspace_members wm2
      where wm2.workspace_id = workspace_id
        and wm2.user_id = auth.uid()
    )
  );

create policy "Owners can manage members"
  on workspace_members for all
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );


-- ── Workspace invites ─────────────────────────────────────────
create table if not exists workspace_invites (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  email        text not null,
  role         text not null default 'editor',
  token        text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_by   uuid references auth.users,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  used_at      timestamptz,
  created_at   timestamptz not null default now()
);

alter table workspace_invites enable row level security;

-- Workspace owners can manage invites
create policy "Owners manage invites"
  on workspace_invites for all
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );

-- Anyone with the token can read (for accept flow) — handled via service role in API
create policy "Service role reads invites"
  on workspace_invites for select
  using (auth.role() = 'service_role');
