create table if not exists discord_members (
  discord_user_id text primary key,
  discord_username text,
  player_tag text not null,
  player_name text,
  clan_role text default 'member',
  updated_at timestamptz default now(),
  unique(player_tag)
);

create table if not exists discord_config (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

create table if not exists discord_channels (
  feature text primary key,
  webhook_url text,
  enabled boolean default true,
  updated_at timestamptz default now()
);

create table if not exists discord_promotions_sent (
  player_tag text not null,
  rank_name text not null,
  sent_at timestamptz default now(),
  primary key (player_tag, rank_name)
);
