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

-- Discord Seen Members: tracks who the gatekeeper cron has already
-- welcomed/gated, so it doesn't re-process the same join every run
create table if not exists discord_seen_members (
  discord_user_id text primary key,
  first_seen_at timestamptz default now()
);

-- Discord Members: links a Discord account to a Clash Royale account,
-- set by /register
create table if not exists discord_members (
  discord_user_id text primary key,
  discord_username text,
  player_tag text not null,
  player_name text,
  clan_role text default 'member',
  updated_at timestamptz default now(),
  unique(player_tag)
);

-- Discord Config: generic key/value settings for bot features
-- (e.g. member_count_threshold, low_fame_threshold, kick_avg_threshold)
create table if not exists discord_config (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Discord Channels: per-feature webhook URLs, set on the /discord config page
create table if not exists discord_channels (
  feature text primary key,
  webhook_url text,
  enabled boolean default true,
  updated_at timestamptz default now()
);

-- Discord Promotions Sent: tracks which fame-rank promotion messages have
-- already been posted, so they don't repeat every time fame is recomputed
create table if not exists discord_promotions_sent (
  player_tag text not null,
  rank_name text not null,
  sent_at timestamptz default now(),
  primary key (player_tag, rank_name)
);

-- Recruit Prospects: player tags admins are tracking as potential recruits
create table if not exists recruit_prospects (
  id uuid primary key default gen_random_uuid(),
  player_tag text not null unique,
  notes text,
  added_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_war_member_stats_snapshot on war_member_stats(snapshot_id);
create index if not exists idx_war_member_stats_player on war_member_stats(player_tag);
create index if not exists idx_war_snapshots_season on war_snapshots(season_id, section_index);
