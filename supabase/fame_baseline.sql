-- Run this in Supabase SQL Editor to seed historical war fame data
-- Data sourced from clan spreadsheet through 2026-05-03

CREATE TABLE IF NOT EXISTS fame_baseline (
  id SERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  player_tag TEXT,
  baseline_fame INT NOT NULL DEFAULT 0,
  UNIQUE(player_name)
);

INSERT INTO fame_baseline (player_name, baseline_fame) VALUES
('Stormy05', 41100),
('MeowCactus', 38400),
('Rouge', 36800),
('BootyAnalyzer', 36750),
('BartholomewKUMA', 35650),
('Emote', 35600),
('Itachi', 34850),
('Deyner', 34750),
('Minato Namikaze', 34550),
('L.D.Fisherman', 34450),
('Luke', 34000),
('Natertater', 33800),
('Prometheus', 33800),
('Instalock Jett', 33300),
('Kurosaki', 32950),
('NotNoobyChips', 32700),
('Jedi_CR', 32600),
('Bababooie', 32500),
('Kyjames32', 32400),
('MITBRAN', 32400),
('Marco L.', 32250),
('Bubthork', 30975),
('Master Shanks', 30700),
('Elite Barbarian', 30400),
('OM4R', 29700),
('Guts', 29600),
('Speddogclann', 28900),
('Borigella', 28300),
('Bobflames', 28150),
('Luna', 28000),
('Kalejuice', 27900),
('Portgas D Asce', 27800),
('SogeKing', 27050),
('Dev', 26700),
('Gaster', 26600),
('Jay', 26350),
('Monkey D. Luffy', 26200),
('Kazekage Kal', 24100),
('Thamer115', 23950),
('Sorla 10K', 23800),
('Christian', 23650),
('diu', 21150),
('La Dolce Vita', 20300),
('Mak', 20075),
('TSM_ASU', 17000),
('Madeyas', 12150),
('''-', 11800),
('Mike', 5050),
('Jabben28', 1500)
ON CONFLICT (player_name) DO UPDATE SET baseline_fame = EXCLUDED.baseline_fame;

-- Known player tags (resolves name-matching issues for these players)
UPDATE fame_baseline SET player_tag = '#URULVPG'   WHERE baseline_fame = 11800;
UPDATE fame_baseline SET player_tag = '#GUPRPQ8LJ' WHERE baseline_fame = 27900;
UPDATE fame_baseline SET player_tag = '#29QGYGJPL' WHERE baseline_fame = 20075;
UPDATE fame_baseline SET player_tag = '#GUYP8JCJG' WHERE baseline_fame = 28000;
UPDATE fame_baseline SET player_tag = '#Q0CRLJQC8' WHERE baseline_fame = 36750;
