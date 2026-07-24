-- Annonces importantes : ajoute à la table « notifications » de quoi diffuser
-- une annonce en plein écran dans l'application, en plus de la cloche et du push.
--
-- À coller dans Supabase ▸ SQL Editor. Réexécutable sans risque : les colonnes
-- ne sont ajoutées que si elles n'existent pas déjà, aucune donnée n'est touchée.

alter table public.notifications add column if not exists important boolean not null default false;
alter table public.notifications add column if not exists title_fr  text;
alter table public.notifications add column if not exists title_en  text;

-- Contrôle : les trois colonnes doivent apparaître.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'notifications'
  and column_name in ('important', 'title_fr', 'title_en')
order by column_name;
