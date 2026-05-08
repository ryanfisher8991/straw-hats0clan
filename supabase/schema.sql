-- Meta Decks: curated war deck database
create table if not exists meta_decks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cards text[] not null,         -- array of 8 card names matching CR API
  archetype text not null,       -- e.g. 'cycle', 'beatdown', 'control', 'siege'
  avg_elixir decimal(3,1),
  created_at timestamptz default now()
);

-- Clan Snapshots: weekly clan stat history
create table if not exists clan_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshotted_at timestamptz default now(),
  trophy_count int,
  member_count int,
  clan_war_trophies int,
  donations_per_week int,
  raw_data jsonb
);

-- War Snapshots: raw river race results per week
create table if not exists war_snapshots (
  id uuid primary key default gen_random_uuid(),
  season_id int not null,
  section_index int not null,
  snapshotted_at timestamptz default now(),
  raw_data jsonb,
  unique(season_id, section_index)
);

-- War Member Stats: per-member performance per race
create table if not exists war_member_stats (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid references war_snapshots(id) on delete cascade,
  player_tag text not null,
  player_name text not null,
  fame int default 0,
  repair_points int default 0,
  boat_attacks int default 0,
  decks_used int default 0,
  finish_time timestamptz
);

-- Graveyard: players who have left or been kicked from the clan
create table if not exists graveyard (
  id uuid primary key default gen_random_uuid(),
  player_tag text not null unique,
  player_name text not null,
  reason text,
  kicked_at timestamptz default now()
);

-- Member Trophy Snapshots: weekly trophy history per member
create table if not exists member_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshotted_at timestamptz default now(),
  player_tag text not null,
  player_name text not null,
  trophies int default 0,
  donations int default 0
);

-- Fame Baseline: historical war fame totals from before automated tracking
create table if not exists fame_baseline (
  id serial primary key,
  player_name text not null,
  player_tag text,
  baseline_fame int not null default 0,
  unique(player_name)
);

-- Indexes for common queries
create index if not exists idx_war_member_stats_snapshot on war_member_stats(snapshot_id);
create index if not exists idx_war_member_stats_player on war_member_stats(player_tag);
create index if not exists idx_war_snapshots_season on war_snapshots(season_id, section_index);
