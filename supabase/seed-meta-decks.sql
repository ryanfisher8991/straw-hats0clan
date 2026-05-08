-- Meta Deck Seed Data — Clash Royale War Decks
-- Run this in Supabase SQL Editor
-- Card names must match exactly what the CR API returns

-- Clear existing if re-running
truncate table meta_decks restart identity;

insert into meta_decks (name, cards, archetype, avg_elixir) values

-- === CYCLE DECKS ===
('Hog Rider Cycle',
 ARRAY['Hog Rider','Musketeer','Skeletons','Ice Spirit','Cannon','Fireball','Log','Ice Golem'],
 'cycle', 3.0),

('Goblin Barrel Cycle',
 ARRAY['Goblin Barrel','Valkyrie','Inferno Tower','Cannon','Fireball','Log','Ice Spirit','Skeletons'],
 'cycle', 3.0),

('Miner Poison Control',
 ARRAY['Miner','Poison','Mini P.E.K.K.A','Goblin Gang','Inferno Tower','Tornado','Electro Wizard','Log'],
 'cycle', 3.4),

('X-Bow Cycle',
 ARRAY['X-Bow','Ice Spirit','Skeletons','Archers','The Log','Fireball','Tesla','Knight'],
 'cycle', 2.9),

('Ram Rider Cycle',
 ARRAY['Ram Rider','Skeletons','Ice Spirit','Cannon','Fireball','Log','Musketeer','Ice Golem'],
 'cycle', 3.1),

('Royal Giant Cycle',
 ARRAY['Royal Giant','Electro Spirit','Skeletons','Ice Spirit','Cannon','Fireball','Log','Musketeer'],
 'cycle', 2.8),

('Mortar Bait',
 ARRAY['Mortar','Goblin Gang','Spear Goblins','Princess','Rocket','Ice Spirit','Knight','Log'],
 'cycle', 3.3),

('Rocket Cycle',
 ARRAY['Rocket','Giant Snowball','Arrows','Ice Spirit','Skeletons','Cannon','Musketeer','Knight'],
 'cycle', 3.4),

-- === BEATDOWN DECKS ===
('Golem Lightning',
 ARRAY['Golem','Lightning','Baby Dragon','Night Witch','Lumberjack','Mega Minion','Tombstone','Zap'],
 'beatdown', 4.5),

('Giant Double Prince',
 ARRAY['Giant','Dark Prince','Prince','Electro Wizard','Poison','Zap','Mega Minion','Tombstone'],
 'beatdown', 4.1),

('Lava Hound Balloon',
 ARRAY['Lava Hound','Balloon','Mega Minion','Tombstone','Zap','Arrows','Lightning','Lumberjack'],
 'beatdown', 4.0),

('P.E.K.K.A Bridge Spam',
 ARRAY['P.E.K.K.A','Battle Ram','Bandit','Royal Ghost','Dark Prince','Electro Wizard','Zap','Poison'],
 'beatdown', 4.1),

('Balloon Freeze',
 ARRAY['Balloon','Freeze','Minion Horde','Mega Minion','Inferno Dragon','Tornado','Lightning','Arrows'],
 'beatdown', 4.3),

('Sparky Giant',
 ARRAY['Giant','Sparky','Minions','Zap','Electro Wizard','Mega Minion','Poison','Tombstone'],
 'beatdown', 4.0),

('Elixir Golem',
 ARRAY['Elixir Golem','Battle Healer','Dark Prince','Void','Lightning','Mega Minion','Zap','Skeletons'],
 'beatdown', 3.8),

('Three Musketeers',
 ARRAY['Three Musketeers','Rascals','Battle Ram','Dark Prince','Minions','Zap','Poison','Elixir Collector'],
 'beatdown', 4.3),

('Skeleton Giants',
 ARRAY['Giant Skeleton','Balloon','Freeze','Arrows','Minion Horde','Zap','Ice Spirit','Knight'],
 'beatdown', 4.1),

-- === CONTROL DECKS ===
('Graveyard Poison',
 ARRAY['Graveyard','Poison','Knight','Archers','Mega Minion','Tornado','Inferno Tower','Zap'],
 'control', 3.6),

('Sparky Electro Giant',
 ARRAY['Electro Giant','Sparky','Electro Spirit','Zap','Tornado','Arrows','Mega Minion','Clone'],
 'control', 3.8),

('Witch Control',
 ARRAY['Witch','Bowler','Giant','Tornado','Earthquake','Arrows','Zap','Elixir Collector'],
 'control', 4.1),

('Furnace Bait',
 ARRAY['Furnace','Goblin Barrel','Goblin Gang','Valkyrie','Fireball','Log','Skeleton Army','Inferno Tower'],
 'siege', 3.3),

('Royal Recruits Control',
 ARRAY['Royal Recruits','Barbarian Barrel','Goblin Giant','Sparky','Electro Wizard','Arrows','Fireball','Knight'],
 'control', 4.0),

('Miner Wall Breakers',
 ARRAY['Miner','Wall Breakers','Goblin Gang','Valkyrie','Inferno Tower','Rocket','Log','Electro Spirit'],
 'cycle', 3.3),

-- === SIEGE DECKS ===
('Mega Mortar Siege',
 ARRAY['Mortar','Flying Machine','Skeleton Barrel','Arrows','Giant Snowball','Goblins','Ice Golem','Bats'],
 'siege', 2.9),

('X-Bow Control',
 ARRAY['X-Bow','Cannon','Archers','Bats','Electro Spirit','Log','Giant Snowball','Knight'],
 'siege', 2.6),

-- === EXTRA UNIQUE POOLS (maximize card variety for 4-deck combinations) ===
('Hog 2.6',
 ARRAY['Hog Rider','Cannon','Ice Spirit','Skeletons','Musketeer','Fireball','Log','Ice Golem'],
 'cycle', 2.6),

('Lava Clone',
 ARRAY['Lava Hound','Clone','Balloon','Mega Minion','Bats','Tombstone','Arrows','Zap'],
 'beatdown', 4.0),

('Bridge Spam Ram',
 ARRAY['Battle Ram','P.E.K.K.A','Royal Ghost','Bandit','Electro Wizard','Fireball','Zap','Dark Prince'],
 'beatdown', 4.2),

('Miner Cycle B',
 ARRAY['Miner','Goblin Barrel','Princess','Inferno Tower','Poison','Log','Bats','Archers'],
 'cycle', 3.4),

('Witch Skeleton Army',
 ARRAY['Witch','Skeleton Army','Giant','Balloon','Lightning','Zap','Arrows','Tombstone'],
 'beatdown', 4.5);
