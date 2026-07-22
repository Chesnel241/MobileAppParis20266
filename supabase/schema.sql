-- Schéma Supabase pour la Convention Paris 2026.
-- À exécuter une fois dans l'éditeur SQL de votre projet Supabase.
--
-- Principe de sécurité : RLS activé sur toutes les tables et AUCUNE policy pour
-- les rôles anon/authenticated. Le client ne touche donc jamais les tables.
-- Seules les fonctions Vercel, avec la clé service_role, y accèdent (service_role
-- contourne RLS). L'autorisation est faite dans les fonctions, comme auparavant.

-- ---------- Tables ----------

create table if not exists participants (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique,
  first_name  text not null,
  last_name   text not null,
  phone       text not null,
  country     text not null,
  role        text not null default 'participant',
  created_at  timestamptz not null default now(),
  last_seen   timestamptz
);

create table if not exists questions (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  text           text not null,
  status         text not null default 'pending',
  pastor_name    text,
  place          text,
  "time"         text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_questions_participant on questions(participant_id);
create index if not exists idx_questions_status on questions(status);

create table if not exists admin_sessions (
  token       text primary key,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

create table if not exists checkins (
  participant_id uuid primary key references participants(id) on delete cascade,
  created_at     timestamptz not null default now()
);

create table if not exists content (
  section     text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  text_fr     text not null,
  text_en     text not null,
  created_at  timestamptz not null default now()
);

create table if not exists housing (
  id             uuid primary key default gen_random_uuid(),
  first_name     text not null,
  last_name      text not null,
  phone          text not null default '',
  country        text not null default '',
  address        text not null default '',
  notes          text not null default '',
  participant_id uuid references participants(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index if not exists idx_housing_participant
  on housing(participant_id) where participant_id is not null;

create table if not exists push_subscriptions (
  endpoint       text primary key,
  p256dh         text not null,
  auth           text not null,
  participant_id uuid references participants(id) on delete cascade,
  lang           text not null default 'fr',
  created_at     timestamptz not null default now(),
  last_error     text
);

create table if not exists photos (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  file           text not null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_photos_created on photos(created_at);

-- Limiteur de débit simple (le serverless n'a pas de mémoire partagée).
create table if not exists rate_limits (
  bucket      text not null,
  ip          text not null,
  window_start timestamptz not null default now(),
  count       integer not null default 0,
  primary key (bucket, ip)
);

-- ---------- RLS : tout est refusé au client ----------
-- (le service_role utilisé par les fonctions Vercel contourne RLS)

alter table participants        enable row level security;
alter table questions           enable row level security;
alter table admin_sessions      enable row level security;
alter table checkins            enable row level security;
alter table content             enable row level security;
alter table notifications       enable row level security;
alter table housing             enable row level security;
alter table push_subscriptions  enable row level security;
alter table photos              enable row level security;
alter table rate_limits         enable row level security;
-- Aucune policy créée => anon et authenticated n'ont aucun accès. Voulu.

-- ---------- Fonction d'incrément atomique du limiteur ----------
create or replace function rl_hit(p_bucket text, p_ip text, p_window_seconds int)
returns integer
language plpgsql
as $$
declare
  v_count integer;
begin
  insert into rate_limits (bucket, ip, window_start, count)
  values (p_bucket, p_ip, now(), 1)
  on conflict (bucket, ip) do update set
    count = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then 1
      else rate_limits.count + 1
    end,
    window_start = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then now()
      else rate_limits.window_start
    end
  returning count into v_count;
  return v_count;
end;
$$;

-- ---------- Storage : bucket public pour les médias ----------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
