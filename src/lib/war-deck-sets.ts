export interface DeckCard {
  name: string;
  isEvo?: boolean;
}

export interface WarDeck {
  label: string;
  cards: DeckCard[];
}

export interface DeckSet {
  id: string;
  name: string;
  description: string;
  decks: [WarDeck, WarDeck, WarDeck, WarDeck];
}

/** Strip "Evo " prefix and lowercase for matching against CR API card names */
export function normalizeCardName(name: string): string {
  return name.replace(/^evo\s+/i, "").toLowerCase().trim();
}

// ─── 20 complete 4-deck war sets (32 unique cards per set) ───────────────────
// Sets 1-13: CRL 2025 Season 2 professional duel sets (top 32 Swiss tournament)
// Sets 14-16: popular meta guides (GameRant, SkyCoach, High Ground Gaming)
// Sets 17-20: composed from established archetypes

export const WAR_DECK_SETS: DeckSet[] = [
  // ── CRL 2025 PRO SETS ──────────────────────────────────────────────────────
  {
    id: "crl-1-bassotto",
    name: "RG Monk · Graveyard",
    description: "Royal Giant Monk · Goblin Drill · Hog Earthquake · Graveyard Witch",
    decks: [
      {
        label: "Royal Giant Monk",
        cards: [
          { name: "Royal Giant" },
          { name: "Hunter" },
          { name: "Monk" },
          { name: "Lightning" },
          { name: "Fisherman" },
          { name: "Goblins" },
          { name: "Electro Spirit" },
          { name: "Rage" },
        ],
      },
      {
        label: "Goblin Drill Rocket",
        cards: [
          { name: "Giant Snowball" },
          { name: "Tesla" },
          { name: "Goblin Drill" },
          { name: "Goblin Demolisher" },
          { name: "Rocket" },
          { name: "Valkyrie" },
          { name: "Fire Spirit" },
          { name: "Spear Goblins" },
        ],
      },
      {
        label: "Hog Earthquake",
        cards: [
          { name: "Firecracker" },
          { name: "Cannon" },
          { name: "Hog Rider" },
          { name: "Golden Knight" },
          { name: "Earthquake" },
          { name: "Guards" },
          { name: "Ice Spirit" },
          { name: "The Log" },
        ],
      },
      {
        label: "Graveyard Witch",
        cards: [
          { name: "Witch" },
          { name: "Knight" },
          { name: "Graveyard" },
          { name: "Poison" },
          { name: "Ice Wizard" },
          { name: "Goblin Hut" },
          { name: "Skeletons" },
          { name: "Barbarian Barrel" },
        ],
      },
    ],
  },
  {
    id: "crl-2-sosaa",
    name: "Battle Ram · Goblin Bait",
    description: "Goblin Drill Control · Battle Ram · Hog Wizard · Goblin Barrel Bait",
    decks: [
      {
        label: "Goblin Drill Control",
        cards: [
          { name: "Giant Snowball" },
          { name: "Tesla" },
          { name: "Goblin Drill" },
          { name: "Golden Knight" },
          { name: "Berserker" },
          { name: "Poison" },
          { name: "Ice Wizard" },
          { name: "Fire Spirit" },
        ],
      },
      {
        label: "Battle Ram",
        cards: [
          { name: "Battle Ram" },
          { name: "Zap" },
          { name: "Boss Bandit" },
          { name: "Cannon Cart" },
          { name: "Royal Ghost" },
          { name: "Goblin Curse" },
          { name: "Skeletons" },
          { name: "Barbarian Barrel" },
        ],
      },
      {
        label: "Hog Wizard",
        cards: [
          { name: "Wizard" },
          { name: "Cannon" },
          { name: "Hog Rider" },
          { name: "Monk" },
          { name: "Earthquake" },
          { name: "Guards" },
          { name: "Ice Spirit" },
          { name: "The Log" },
        ],
      },
      {
        label: "Goblin Barrel Bait",
        cards: [
          { name: "Skeleton Barrel" },
          { name: "Goblin Barrel" },
          { name: "Mighty Miner" },
          { name: "Goblin Gang" },
          { name: "Dart Goblin" },
          { name: "Goblin Hut" },
          { name: "Arrows" },
          { name: "Spear Goblins" },
        ],
      },
    ],
  },
  {
    id: "crl-3-alee",
    name: "Lava Miner · Graveyard",
    description: "Graveyard Witch · Lava Miner · Goblin Barrel · Battle Ram",
    decks: [
      {
        label: "Graveyard Witch",
        cards: [
          { name: "Witch" },
          { name: "Knight" },
          { name: "Graveyard" },
          { name: "Poison" },
          { name: "Goblin Hut" },
          { name: "Spear Goblins" },
          { name: "Ice Spirit" },
          { name: "Barbarian Barrel" },
        ],
      },
      {
        label: "Lava Miner",
        cards: [
          { name: "Valkyrie" },
          { name: "Zap" },
          { name: "Lava Hound" },
          { name: "Miner" },
          { name: "Spirit Empress" },
          { name: "Skeleton Dragons" },
          { name: "Goblin Curse" },
          { name: "Tombstone" },
        ],
      },
      {
        label: "Goblin Barrel Bait",
        cards: [
          { name: "Skeleton Barrel" },
          { name: "Goblin Barrel" },
          { name: "Mighty Miner" },
          { name: "Princess" },
          { name: "Goblin Gang" },
          { name: "Dart Goblin" },
          { name: "Fire Spirit" },
          { name: "Cannon" },
        ],
      },
      {
        label: "Battle Ram",
        cards: [
          { name: "Battle Ram" },
          { name: "Lumberjack" },
          { name: "Cannon Cart" },
          { name: "Golden Knight" },
          { name: "Mother Witch" },
          { name: "Royal Ghost" },
          { name: "Heal Spirit" },
          { name: "Giant Snowball" },
        ],
      },
    ],
  },
  {
    id: "crl-4-sosuke",
    name: "Wall Breakers · Mortar",
    description: "Wall Breakers Control · Goblin Drill · Mortar Bait · Hog Earthquake",
    decks: [
      {
        label: "Wall Breakers Control",
        cards: [
          { name: "Wall Breakers" },
          { name: "Zap" },
          { name: "Miner" },
          { name: "Monk" },
          { name: "Spirit Empress" },
          { name: "Goblin Curse" },
          { name: "Guards" },
          { name: "Bomb Tower" },
        ],
      },
      {
        label: "Goblin Drill",
        cards: [
          { name: "Giant Snowball" },
          { name: "Tesla" },
          { name: "Goblin Drill" },
          { name: "Goblin Demolisher" },
          { name: "Knight" },
          { name: "Poison" },
          { name: "Fire Spirit" },
          { name: "Skeletons" },
        ],
      },
      {
        label: "Mortar Skeleton King",
        cards: [
          { name: "Skeleton Barrel" },
          { name: "Mortar" },
          { name: "Skeleton King" },
          { name: "Cannon Cart" },
          { name: "Goblin Gang" },
          { name: "Ice Wizard" },
          { name: "Arrows" },
          { name: "Bats" },
        ],
      },
      {
        label: "Hog Earthquake",
        cards: [
          { name: "Firecracker" },
          { name: "Cannon" },
          { name: "Hog Rider" },
          { name: "Giant Skeleton" },
          { name: "Earthquake" },
          { name: "Goblins" },
          { name: "Ice Spirit" },
          { name: "The Log" },
        ],
      },
    ],
  },
  {
    id: "crl-5-sandbox",
    name: "Goblin Barrel · Pekka",
    description: "Goblin Barrel Bait · RG Hog · Pekka Bridge Spam · Electro Giant",
    decks: [
      {
        label: "Goblin Barrel Bait",
        cards: [
          { name: "Skeleton Barrel" },
          { name: "Goblin Barrel" },
          { name: "Valkyrie" },
          { name: "Princess" },
          { name: "Goblin Gang" },
          { name: "Dart Goblin" },
          { name: "Goblin Hut" },
          { name: "Ice Spirit" },
        ],
      },
      {
        label: "Royal Giant Hog",
        cards: [
          { name: "Royal Giant" },
          { name: "Hunter" },
          { name: "Monk" },
          { name: "Fisherman" },
          { name: "Fireball" },
          { name: "Skeletons" },
          { name: "Electro Spirit" },
          { name: "The Log" },
        ],
      },
      {
        label: "Pekka Bridge Spam",
        cards: [
          { name: "Battle Ram" },
          { name: "Lumberjack" },
          { name: "P.E.K.K.A" },
          { name: "Mother Witch" },
          { name: "Royal Ghost" },
          { name: "Electro Wizard" },
          { name: "Bandit" },
          { name: "Arrows" },
        ],
      },
      {
        label: "Electro Giant",
        cards: [
          { name: "Bomber" },
          { name: "Cannon" },
          { name: "Electro Giant" },
          { name: "Golden Knight" },
          { name: "Spirit Empress" },
          { name: "Lightning" },
          { name: "Tornado" },
          { name: "Barbarian Barrel" },
        ],
      },
    ],
  },
  {
    id: "crl-6-hasiel",
    name: "Giant Inferno · Battle Ram",
    description: "Inferno Giant · Goblin Drill · Miner Rocket · Battle Ram",
    decks: [
      {
        label: "Inferno Dragon Giant",
        cards: [
          { name: "Inferno Dragon" },
          { name: "Zap" },
          { name: "Giant" },
          { name: "Goblin Machine" },
          { name: "Boss Bandit" },
          { name: "Goblin Curse" },
          { name: "Goblins" },
          { name: "Rage" },
        ],
      },
      {
        label: "Goblin Drill Control",
        cards: [
          { name: "Giant Snowball" },
          { name: "Cannon" },
          { name: "Goblin Drill" },
          { name: "Goblin Demolisher" },
          { name: "Knight" },
          { name: "Poison" },
          { name: "Guards" },
          { name: "Fire Spirit" },
        ],
      },
      {
        label: "Miner Rocket",
        cards: [
          { name: "Valkyrie" },
          { name: "Ice Spirit" },
          { name: "Miner" },
          { name: "Rocket" },
          { name: "Ice Wizard" },
          { name: "Goblin Hut" },
          { name: "Spear Goblins" },
          { name: "The Log" },
        ],
      },
      {
        label: "Battle Ram",
        cards: [
          { name: "Battle Ram" },
          { name: "Lumberjack" },
          { name: "Monk" },
          { name: "Cannon Cart" },
          { name: "Mother Witch" },
          { name: "Electro Wizard" },
          { name: "Barbarian Barrel" },
          { name: "Heal Spirit" },
        ],
      },
    ],
  },
  {
    id: "crl-7-mohamedlight",
    name: "Miner Phoenix · Graveyard",
    description: "Miner Phoenix Control · RG Hog · Graveyard · E-Dragon Giant",
    decks: [
      {
        label: "Miner Phoenix Control",
        cards: [
          { name: "Zap" },
          { name: "Ice Spirit" },
          { name: "Miner" },
          { name: "Phoenix" },
          { name: "Golden Knight" },
          { name: "Goblin Curse" },
          { name: "Guards" },
          { name: "Tesla" },
        ],
      },
      {
        label: "Royal Giant Hog",
        cards: [
          { name: "Royal Giant" },
          { name: "Hunter" },
          { name: "Monk" },
          { name: "Fisherman" },
          { name: "Fireball" },
          { name: "Goblins" },
          { name: "Electro Spirit" },
          { name: "The Log" },
        ],
      },
      {
        label: "Graveyard Witch",
        cards: [
          { name: "Valkyrie" },
          { name: "Witch" },
          { name: "Graveyard" },
          { name: "Poison" },
          { name: "Goblin Hut" },
          { name: "Spear Goblins" },
          { name: "Skeletons" },
          { name: "Barbarian Barrel" },
        ],
      },
      {
        label: "Electro Dragon Giant",
        cards: [
          { name: "Electro Dragon" },
          { name: "Giant Snowball" },
          { name: "Goblin Drill" },
          { name: "Giant Skeleton" },
          { name: "Lumberjack" },
          { name: "Magic Archer" },
          { name: "Berserker" },
          { name: "Royal Ghost" },
        ],
      },
    ],
  },
  {
    id: "crl-8-egor",
    name: "Wall Breakers · Graveyard",
    description: "Wall Breakers Bait · Graveyard Witch · Goblin Drill · Miner Rocket",
    decks: [
      {
        label: "Wall Breakers Bait",
        cards: [
          { name: "Wall Breakers" },
          { name: "Goblin Barrel" },
          { name: "Golden Knight" },
          { name: "Princess" },
          { name: "Goblin Gang" },
          { name: "Dart Goblin" },
          { name: "Electro Spirit" },
          { name: "Cannon" },
        ],
      },
      {
        label: "Graveyard Witch",
        cards: [
          { name: "Witch" },
          { name: "Knight" },
          { name: "Graveyard" },
          { name: "Poison" },
          { name: "Goblin Hut" },
          { name: "Skeletons" },
          { name: "Ice Spirit" },
          { name: "Barbarian Barrel" },
        ],
      },
      {
        label: "Goblin Drill Control",
        cards: [
          { name: "Giant Snowball" },
          { name: "Tesla" },
          { name: "Goblin Drill" },
          { name: "Mighty Miner" },
          { name: "Goblin Demolisher" },
          { name: "Fireball" },
          { name: "Guards" },
          { name: "Fire Spirit" },
        ],
      },
      {
        label: "Miner Rocket",
        cards: [
          { name: "Valkyrie" },
          { name: "Bats" },
          { name: "Miner" },
          { name: "Rocket" },
          { name: "Ice Wizard" },
          { name: "Spear Goblins" },
          { name: "The Log" },
          { name: "Bomb Tower" },
        ],
      },
    ],
  },
  {
    id: "crl-9-adnan",
    name: "Mortar · Battle Ram",
    description: "Mortar Little Prince · Goblin Barrel · Battle Ram · Goblin Drill",
    decks: [
      {
        label: "Mortar Little Prince",
        cards: [
          { name: "Skeleton Barrel" },
          { name: "Mortar" },
          { name: "Little Prince" },
          { name: "Berserker" },
          { name: "Fireball" },
          { name: "Guards" },
          { name: "Arrows" },
          { name: "Spear Goblins" },
        ],
      },
      {
        label: "Goblin Barrel Bait",
        cards: [
          { name: "Goblin Barrel" },
          { name: "Dart Goblin" },
          { name: "Valkyrie" },
          { name: "Princess" },
          { name: "Goblin Gang" },
          { name: "Ice Spirit" },
          { name: "The Log" },
          { name: "Inferno Tower" },
        ],
      },
      {
        label: "Battle Ram",
        cards: [
          { name: "Battle Ram" },
          { name: "Lumberjack" },
          { name: "Cannon Cart" },
          { name: "Mother Witch" },
          { name: "Royal Ghost" },
          { name: "Electro Wizard" },
          { name: "Heal Spirit" },
          { name: "Rage" },
        ],
      },
      {
        label: "Goblin Drill Control",
        cards: [
          { name: "Giant Snowball" },
          { name: "Tesla" },
          { name: "Goblin Drill" },
          { name: "Mighty Miner" },
          { name: "Goblin Demolisher" },
          { name: "Poison" },
          { name: "Goblins" },
          { name: "Electro Spirit" },
        ],
      },
    ],
  },
  {
    id: "crl-10-lucasxgamer",
    name: "Battle Ram · Royal Giant",
    description: "Battle Ram Boss · Mortar Little Prince · Royal Hogs · RG Wizard",
    decks: [
      {
        label: "Battle Ram Boss",
        cards: [
          { name: "Battle Ram" },
          { name: "Zap" },
          { name: "Boss Bandit" },
          { name: "Cannon Cart" },
          { name: "Royal Ghost" },
          { name: "Goblin Curse" },
          { name: "Barbarian Barrel" },
          { name: "Heal Spirit" },
        ],
      },
      {
        label: "Mortar Little Prince",
        cards: [
          { name: "Skeleton Barrel" },
          { name: "Mortar" },
          { name: "Little Prince" },
          { name: "Spirit Empress" },
          { name: "Berserker" },
          { name: "Fireball" },
          { name: "Spear Goblins" },
          { name: "Electro Spirit" },
        ],
      },
      {
        label: "Royal Hogs",
        cards: [
          { name: "Tesla" },
          { name: "Ice Spirit" },
          { name: "Royal Hogs" },
          { name: "Archer Queen" },
          { name: "Earthquake" },
          { name: "Skeletons" },
          { name: "Royal Delivery" },
          { name: "The Log" },
        ],
      },
      {
        label: "Royal Giant Wizard",
        cards: [
          { name: "Royal Giant" },
          { name: "Wizard" },
          { name: "Monk" },
          { name: "Lightning" },
          { name: "Fisherman" },
          { name: "Guards" },
          { name: "Rage" },
          { name: "Tombstone" },
        ],
      },
    ],
  },
  {
    id: "crl-11-gunnar",
    name: "Hog Balloon · Goblin Drill",
    description: "Hog Earthquake · Balloon Miner · Goblin Drill · Goblin Cage RH",
    decks: [
      {
        label: "Hog Earthquake",
        cards: [
          { name: "Firecracker" },
          { name: "Tesla" },
          { name: "Hog Rider" },
          { name: "Boss Bandit" },
          { name: "Earthquake" },
          { name: "Goblins" },
          { name: "Electro Spirit" },
          { name: "The Log" },
        ],
      },
      {
        label: "Balloon Miner",
        cards: [
          { name: "Inferno Dragon" },
          { name: "Zap" },
          { name: "Balloon" },
          { name: "Miner" },
          { name: "Monk" },
          { name: "Guards" },
          { name: "Arrows" },
          { name: "Bomb Tower" },
        ],
      },
      {
        label: "Goblin Drill Control",
        cards: [
          { name: "Giant Snowball" },
          { name: "Cannon" },
          { name: "Goblin Drill" },
          { name: "Goblin Demolisher" },
          { name: "Spirit Empress" },
          { name: "Poison" },
          { name: "Skeletons" },
          { name: "Ice Spirit" },
        ],
      },
      {
        label: "Goblin Cage Royal Hogs",
        cards: [
          { name: "Goblin Cage" },
          { name: "Royal Recruits" },
          { name: "Royal Hogs" },
          { name: "Golden Knight" },
          { name: "Flying Machine" },
          { name: "Mother Witch" },
          { name: "Fireball" },
          { name: "Barbarian Barrel" },
        ],
      },
    ],
  },
  {
    id: "crl-12-jonah",
    name: "Lava Hound · Pekka",
    description: "Lava Hound Control · Pekka Bridge Spam · Giant Inferno · Graveyard",
    decks: [
      {
        label: "Lava Hound Control",
        cards: [
          { name: "Valkyrie" },
          { name: "Goblin Cage" },
          { name: "Lava Hound" },
          { name: "Spirit Empress" },
          { name: "Lightning" },
          { name: "Skeleton Dragons" },
          { name: "Guards" },
          { name: "Arrows" },
        ],
      },
      {
        label: "Pekka Bridge Spam",
        cards: [
          { name: "Battle Ram" },
          { name: "P.E.K.K.A" },
          { name: "Golden Knight" },
          { name: "Mother Witch" },
          { name: "Royal Ghost" },
          { name: "Fireball" },
          { name: "Electro Wizard" },
          { name: "Barbarian Barrel" },
        ],
      },
      {
        label: "Giant Inferno",
        cards: [
          { name: "Inferno Dragon" },
          { name: "Zap" },
          { name: "Giant" },
          { name: "Goblin Machine" },
          { name: "Boss Bandit" },
          { name: "Goblin Curse" },
          { name: "Heal Spirit" },
          { name: "Rage" },
        ],
      },
      {
        label: "Graveyard Witch",
        cards: [
          { name: "Witch" },
          { name: "Knight" },
          { name: "Graveyard" },
          { name: "Poison" },
          { name: "Ice Wizard" },
          { name: "Goblin Hut" },
          { name: "Skeletons" },
          { name: "The Log" },
        ],
      },
    ],
  },
  {
    id: "crl-13-erick",
    name: "Battle Ram · Graveyard",
    description: "Pekka Bridge Spam · Mortar Bait · Graveyard Witch · RG Monk",
    decks: [
      {
        label: "Pekka Bridge Spam",
        cards: [
          { name: "Battle Ram" },
          { name: "P.E.K.K.A" },
          { name: "Golden Knight" },
          { name: "Mother Witch" },
          { name: "Royal Ghost" },
          { name: "Electro Wizard" },
          { name: "Arrows" },
          { name: "Rage" },
        ],
      },
      {
        label: "Mortar Bait",
        cards: [
          { name: "Skeleton Barrel" },
          { name: "Mortar" },
          { name: "Spirit Empress" },
          { name: "Berserker" },
          { name: "Fireball" },
          { name: "Goblin Gang" },
          { name: "Spear Goblins" },
          { name: "The Log" },
        ],
      },
      {
        label: "Graveyard Witch",
        cards: [
          { name: "Witch" },
          { name: "Knight" },
          { name: "Graveyard" },
          { name: "Poison" },
          { name: "Ice Wizard" },
          { name: "Goblin Hut" },
          { name: "Skeletons" },
          { name: "Barbarian Barrel" },
        ],
      },
      {
        label: "Royal Giant Monk",
        cards: [
          { name: "Royal Giant" },
          { name: "Wizard" },
          { name: "Monk" },
          { name: "Fisherman" },
          { name: "Goblin Curse" },
          { name: "Zappies" },
          { name: "Zap" },
          { name: "Tombstone" },
        ],
      },
    ],
  },

  // ── META GUIDE SETS ────────────────────────────────────────────────────────
  {
    id: "meta-hero-goblin",
    name: "Hero / Goblin Meta",
    description: "Goblinstein beatdown · MK Miner · Lava Hound · Log Bait",
    decks: [
      {
        label: "Goblinstein Beatdown",
        cards: [
          { name: "P.E.K.K.A", isEvo: true },
          { name: "Electro Dragon", isEvo: true },
          { name: "Rage" },
          { name: "Tornado" },
          { name: "Royal Ghost" },
          { name: "Ice Wizard" },
          { name: "Ram Rider" },
          { name: "Goblinstein" },
        ],
      },
      {
        label: "MK Miner",
        cards: [
          { name: "Mega Knight", isEvo: true },
          { name: "Bats", isEvo: true },
          { name: "Wall Breakers" },
          { name: "Zap" },
          { name: "Barbarian Barrel" },
          { name: "Miner" },
          { name: "Bandit" },
          { name: "Musketeer" },
        ],
      },
      {
        label: "Lava Hound",
        cards: [
          { name: "Bomber", isEvo: true },
          { name: "Goblin Cage", isEvo: true },
          { name: "Arrows" },
          { name: "Guards" },
          { name: "Skeleton Dragons" },
          { name: "Inferno Dragon" },
          { name: "Lightning" },
          { name: "Lava Hound" },
        ],
      },
      {
        label: "Log Bait",
        cards: [
          { name: "Goblin Barrel", isEvo: true },
          { name: "Knight", isEvo: true },
          { name: "The Log" },
          { name: "Dart Goblin" },
          { name: "Goblin Gang" },
          { name: "Princess" },
          { name: "Rascals" },
          { name: "Prince" },
        ],
      },
    ],
  },
  {
    id: "meta-furnace-control",
    name: "Furnace Drill Control",
    description: "Furnace cycle · Royal Hogs · Giant Sparky · RG Monk",
    decks: [
      {
        label: "Furnace Drill",
        cards: [
          { name: "Cannon", isEvo: true },
          { name: "Furnace", isEvo: true },
          { name: "Ice Spirit" },
          { name: "Skeletons" },
          { name: "Knight" },
          { name: "Goblin Drill" },
          { name: "Poison" },
          { name: "Vines" },
        ],
      },
      {
        label: "Royal Hogs Bait",
        cards: [
          { name: "Goblin Cage", isEvo: true },
          { name: "Royal Recruits", isEvo: true },
          { name: "Electro Spirit" },
          { name: "Barbarian Barrel" },
          { name: "Goblin Gang" },
          { name: "Fireball" },
          { name: "Tesla" },
          { name: "Royal Hogs" },
        ],
      },
      {
        label: "Giant Sparky",
        cards: [
          { name: "Bats", isEvo: true },
          { name: "Zap", isEvo: true },
          { name: "Arrows" },
          { name: "Skeleton Army" },
          { name: "Mini P.E.K.K.A" },
          { name: "Giant" },
          { name: "Minion Horde" },
          { name: "Sparky" },
        ],
      },
      {
        label: "RG Monk",
        cards: [
          { name: "Executioner", isEvo: true },
          { name: "Royal Giant", isEvo: true },
          { name: "Berserker" },
          { name: "The Log" },
          { name: "Fisherman" },
          { name: "Guards" },
          { name: "Minions" },
          { name: "Monk" },
        ],
      },
    ],
  },
  {
    id: "meta-goblin-golem",
    name: "Goblin Tribe / Golem",
    description: "Goblin attack · Royal Recruits · Golem beatdown · Royal Giant",
    decks: [
      {
        label: "Goblin Attack",
        cards: [
          { name: "Dart Goblin", isEvo: true },
          { name: "Goblin Barrel", isEvo: true },
          { name: "Goblin Hut" },
          { name: "Goblin Machine" },
          { name: "Skeletons" },
          { name: "Goblin Demolisher" },
          { name: "Berserker" },
          { name: "Arrows" },
        ],
      },
      {
        label: "Royal Recruits Push",
        cards: [
          { name: "Firecracker", isEvo: true },
          { name: "Royal Recruits", isEvo: true },
          { name: "Golden Knight" },
          { name: "Flying Machine" },
          { name: "Goblin Gang" },
          { name: "The Log" },
          { name: "Tombstone" },
          { name: "Heal Spirit" },
        ],
      },
      {
        label: "Golem Beatdown",
        cards: [
          { name: "Lumberjack", isEvo: true },
          { name: "Valkyrie", isEvo: true },
          { name: "Golem" },
          { name: "Electro Wizard" },
          { name: "Tornado" },
          { name: "Skeleton Army" },
          { name: "Bomber" },
          { name: "Electro Spirit" },
        ],
      },
      {
        label: "Royal Giant",
        cards: [
          { name: "Royal Giant", isEvo: true },
          { name: "Witch", isEvo: true },
          { name: "Lightning" },
          { name: "Archers" },
          { name: "Cannon" },
          { name: "Barbarian Barrel" },
          { name: "Ice Spirit" },
          { name: "Guards" },
        ],
      },
    ],
  },

  // ── 2026 META SETS (June 2026 ladder / war duel meta) ─────────────────────

  // Set 21 — Classic four-archetype war quad (most-played 2026 clan war opener)
  {
    id: "meta26-01",
    name: "2.6 Hog / LavaLoon / Log Bait / Graveyard",
    description: "2.6 Hog Cycle · LavaLoon Lightning · Log Bait Rocket · Graveyard Witch Poison",
    decks: [
      {
        label: "2.6 Hog Cycle",
        cards: [
          { name: "Hog Rider" }, { name: "Ice Golem" }, { name: "Musketeer" },
          { name: "Cannon" }, { name: "Fireball" }, { name: "The Log" },
          { name: "Ice Spirit" }, { name: "Skeletons" },
        ],
      },
      {
        label: "LavaLoon Lightning",
        cards: [
          { name: "Lava Hound" }, { name: "Balloon" }, { name: "Inferno Dragon" },
          { name: "Skeleton Dragons" }, { name: "Lightning" }, { name: "Tombstone" },
          { name: "Zap" }, { name: "Minions" },
        ],
      },
      {
        label: "Log Bait Rocket",
        cards: [
          { name: "Goblin Barrel" }, { name: "Princess" }, { name: "Dart Goblin" },
          { name: "Goblin Gang" }, { name: "Knight" }, { name: "Inferno Tower" },
          { name: "Arrows" }, { name: "Rocket" },
        ],
      },
      {
        label: "Graveyard Witch Poison",
        cards: [
          { name: "Graveyard" }, { name: "Witch" }, { name: "Poison" },
          { name: "Ice Wizard" }, { name: "Goblin Hut" }, { name: "Spear Goblins" },
          { name: "Barbarian Barrel" }, { name: "Giant Snowball" },
        ],
      },
    ],
  },

  // Set 22 — PEKKA / Royal Giant / Miner Control / Golem
  {
    id: "meta26-02",
    name: "PEKKA Bridge / RG Monk / Miner Control / Golem",
    description: "PEKKA Bridge Spam · Royal Giant Monk · Miner Mega Knight · Golem Night Witch",
    decks: [
      {
        label: "PEKKA Bridge Spam",
        cards: [
          { name: "P.E.K.K.A" }, { name: "Battle Ram" }, { name: "Bandit" },
          { name: "Royal Ghost" }, { name: "Electro Wizard" }, { name: "Poison" },
          { name: "Zap" }, { name: "Magic Archer" },
        ],
      },
      {
        label: "Royal Giant Monk",
        cards: [
          { name: "Royal Giant" }, { name: "Fisherman" }, { name: "Hunter" },
          { name: "Monk" }, { name: "Fireball" }, { name: "Electro Spirit" },
          { name: "The Log" }, { name: "Ice Spirit" },
        ],
      },
      {
        label: "Miner Mega Knight",
        cards: [
          { name: "Miner" }, { name: "Wall Breakers" }, { name: "Mega Knight" },
          { name: "Goblin Gang" }, { name: "Guards" }, { name: "Tornado" },
          { name: "Giant Snowball" }, { name: "Electro Dragon" },
        ],
      },
      {
        label: "Golem Night Witch",
        cards: [
          { name: "Golem" }, { name: "Night Witch" }, { name: "Baby Dragon" },
          { name: "Lumberjack" }, { name: "Lightning" }, { name: "Skeleton Army" },
          { name: "Arrows" }, { name: "Barbarian Barrel" },
        ],
      },
    ],
  },

  // Set 23 — Evo-heavy set (June 2026 Evo meta)
  {
    id: "meta26-03",
    name: "Evo RG / Evo Log Bait / Electro Giant / Giant Graveyard",
    description: "Evo Royal Giant · Evo Log Bait · Electro Giant Lightning · Giant Graveyard",
    decks: [
      {
        label: "Evo Royal Giant",
        cards: [
          { name: "Royal Giant", isEvo: true }, { name: "Fisherman" }, { name: "Hunter" },
          { name: "Monk" }, { name: "Fireball" }, { name: "Electro Spirit" },
          { name: "Giant Snowball" }, { name: "Tombstone" },
        ],
      },
      {
        label: "Evo Log Bait",
        cards: [
          { name: "Goblin Barrel", isEvo: true }, { name: "Princess", isEvo: true },
          { name: "Dart Goblin" }, { name: "Goblin Gang" },
          { name: "Knight", isEvo: true }, { name: "The Log" },
          { name: "Ice Spirit" }, { name: "Inferno Tower" },
        ],
      },
      {
        label: "Electro Giant Lightning",
        cards: [
          { name: "Electro Giant" }, { name: "Lightning" }, { name: "Tornado" },
          { name: "Miner" }, { name: "Bomber" }, { name: "Zap" },
          { name: "Guards" }, { name: "Electro Dragon" },
        ],
      },
      {
        label: "Giant Graveyard",
        cards: [
          { name: "Giant" }, { name: "Graveyard" }, { name: "Bowler" },
          { name: "Baby Dragon" }, { name: "Poison" }, { name: "Arrows" },
          { name: "Skeleton Army" }, { name: "Barbarian Barrel" },
        ],
      },
    ],
  },

  // Set 24 — Hog EQ / Balloon Miner / Goblin Drill / Battle Ram
  {
    id: "meta26-04",
    name: "Hog EQ / Balloon Miner / Goblin Drill / Battle Ram",
    description: "Hog Earthquake · Balloon Miner · Goblin Drill Tesla · PEKKA Battle Ram",
    decks: [
      {
        label: "Hog Earthquake",
        cards: [
          { name: "Hog Rider" }, { name: "Firecracker" }, { name: "Cannon" },
          { name: "Earthquake" }, { name: "Ice Spirit" }, { name: "The Log" },
          { name: "Skeletons" }, { name: "Golden Knight" },
        ],
      },
      {
        label: "Balloon Miner",
        cards: [
          { name: "Balloon" }, { name: "Miner" }, { name: "Inferno Dragon" },
          { name: "Goblin Cage" }, { name: "Arrows" }, { name: "Guards" },
          { name: "Zap" }, { name: "Bomb Tower" },
        ],
      },
      {
        label: "Goblin Drill Tesla",
        cards: [
          { name: "Goblin Drill" }, { name: "Giant Snowball" }, { name: "Tesla" },
          { name: "Goblin Demolisher" }, { name: "Poison" }, { name: "Knight" },
          { name: "Goblins" }, { name: "Fire Spirit" },
        ],
      },
      {
        label: "PEKKA Battle Ram",
        cards: [
          { name: "P.E.K.K.A" }, { name: "Battle Ram" }, { name: "Lumberjack" },
          { name: "Royal Ghost" }, { name: "Electro Wizard" }, { name: "Bandit" },
          { name: "Fireball" }, { name: "Barbarian Barrel" },
        ],
      },
    ],
  },

  // Set 25 — Miner Vines / LavaLoon / Evo Furnace / Mortar
  {
    id: "meta26-05",
    name: "Miner Vines / LavaLoon / Evo Furnace / Mortar",
    description: "3.0 Miner Vines Cycle · LavaLoon · Evo Furnace Goblin Drill · Mortar Archers",
    decks: [
      {
        label: "3.0 Miner Vines",
        cards: [
          { name: "Miner" }, { name: "Wall Breakers" }, { name: "Goblin Gang" },
          { name: "Guards" }, { name: "Ice Spirit" }, { name: "The Log" },
          { name: "Electro Spirit" }, { name: "Vines" },
        ],
      },
      {
        label: "LavaLoon Arrows",
        cards: [
          { name: "Lava Hound" }, { name: "Balloon" }, { name: "Inferno Dragon" },
          { name: "Skeleton Dragons" }, { name: "Lightning" }, { name: "Tombstone" },
          { name: "Minions" }, { name: "Arrows" },
        ],
      },
      {
        label: "Evo Furnace Drill",
        cards: [
          { name: "Furnace", isEvo: true }, { name: "Cannon", isEvo: true },
          { name: "Skeleton Army" }, { name: "Goblin Barrel" },
          { name: "Knight" }, { name: "Poison" },
          { name: "Giant Snowball" }, { name: "Heal Spirit" },
        ],
      },
      {
        label: "Mortar Cycle",
        cards: [
          { name: "Mortar" }, { name: "Archers" }, { name: "Bats" },
          { name: "Spear Goblins" }, { name: "Zap" }, { name: "Fireball" },
          { name: "Royal Delivery" }, { name: "Tesla" },
        ],
      },
    ],
  },

  // Set 26 — Evo Executioner "War God" (June 2026 meta)
  {
    id: "meta26-06",
    name: "Evo Executioner / Graveyard / PEKKA / Royal Hogs",
    description: "Evo Executioner Balloon (War God) · Graveyard Control · PEKKA · Royal Hogs EQ",
    decks: [
      {
        label: "Evo Executioner Balloon",
        cards: [
          { name: "Executioner", isEvo: true }, { name: "Balloon" }, { name: "Miner" },
          { name: "Vines" }, { name: "Guards" }, { name: "Tornado" },
          { name: "Cannon" }, { name: "Ice Spirit" },
        ],
      },
      {
        label: "Graveyard Witch Control",
        cards: [
          { name: "Graveyard" }, { name: "Witch" }, { name: "Knight" },
          { name: "Poison" }, { name: "Ice Wizard" }, { name: "Goblin Hut" },
          { name: "Spear Goblins" }, { name: "The Log" },
        ],
      },
      {
        label: "PEKKA Bridge Spam",
        cards: [
          { name: "P.E.K.K.A" }, { name: "Battle Ram" }, { name: "Bandit" },
          { name: "Royal Ghost" }, { name: "Electro Wizard" }, { name: "Magic Archer" },
          { name: "Zap" }, { name: "Barbarian Barrel" },
        ],
      },
      {
        label: "Royal Hogs Earthquake",
        cards: [
          { name: "Royal Hogs" }, { name: "Archer Queen" }, { name: "Fisherman" },
          { name: "Tesla" }, { name: "Earthquake" }, { name: "Skeletons" },
          { name: "Royal Delivery" }, { name: "Fireball" },
        ],
      },
    ],
  },

  // Set 27 — Evo Princess Hog / Giant Graveyard / Golem / PEKKA
  {
    id: "meta26-07",
    name: "Evo Princess Hog / Giant Graveyard / Golem / Bridge Spam",
    description: "Evo Princess Hog Cycle · Giant Graveyard · Golem Lightning · PEKKA Bridge",
    decks: [
      {
        label: "Evo Princess Hog",
        cards: [
          { name: "Hog Rider" }, { name: "Princess", isEvo: true }, { name: "Musketeer" },
          { name: "Cannon", isEvo: true }, { name: "Fireball" }, { name: "Ice Golem" },
          { name: "Skeletons", isEvo: true }, { name: "The Log" },
        ],
      },
      {
        label: "Giant Graveyard",
        cards: [
          { name: "Giant" }, { name: "Graveyard" }, { name: "Bowler" },
          { name: "Baby Dragon" }, { name: "Poison" }, { name: "Tombstone" },
          { name: "Arrows" }, { name: "Electro Wizard" },
        ],
      },
      {
        label: "Golem Lightning Tornado",
        cards: [
          { name: "Golem" }, { name: "Night Witch" }, { name: "Lumberjack" },
          { name: "Mega Minion" }, { name: "Lightning" }, { name: "Tornado" },
          { name: "Barbarian Barrel" }, { name: "Zap" },
        ],
      },
      {
        label: "PEKKA Bridge Spam",
        cards: [
          { name: "P.E.K.K.A" }, { name: "Battle Ram" }, { name: "Bandit" },
          { name: "Royal Ghost" }, { name: "Magic Archer" }, { name: "Giant Snowball" },
          { name: "Ice Spirit" }, { name: "Electro Spirit" },
        ],
      },
    ],
  },

  // Set 28 — RG Hog / Mortar / LavaLoon Goblin Cage / Miner Wall
  {
    id: "meta26-08",
    name: "RG Hog / Mortar / LavaLoon / Miner Wall",
    description: "Royal Giant Hog · Mortar Little Prince · LavaLoon Goblin Cage · Miner Wall Breakers",
    decks: [
      {
        label: "Royal Giant Hog",
        cards: [
          { name: "Royal Giant" }, { name: "Hog Rider" }, { name: "Hunter" },
          { name: "Fisherman" }, { name: "Fireball" }, { name: "Electro Spirit" },
          { name: "The Log" }, { name: "Giant Snowball" },
        ],
      },
      {
        label: "Mortar Little Prince",
        cards: [
          { name: "Mortar" }, { name: "Little Prince" }, { name: "Skeleton Barrel" },
          { name: "Berserker" }, { name: "Arrows" }, { name: "Goblins" },
          { name: "Fire Spirit" }, { name: "Spear Goblins" },
        ],
      },
      {
        label: "LavaLoon Goblin Cage",
        cards: [
          { name: "Lava Hound" }, { name: "Balloon" }, { name: "Inferno Dragon" },
          { name: "Skeleton Dragons" }, { name: "Lightning" }, { name: "Minions" },
          { name: "Goblin Cage" }, { name: "Earthquake" },
        ],
      },
      {
        label: "Miner Wall Breakers",
        cards: [
          { name: "Miner" }, { name: "Wall Breakers" }, { name: "Mega Knight" },
          { name: "Poison" }, { name: "Goblin Gang" }, { name: "Guards" },
          { name: "Tornado" }, { name: "Barbarian Barrel" },
        ],
      },
    ],
  },

  // Set 29 — Evo Goblin Bait / Executioner Balloon / RG Monk / Giant Sparky
  {
    id: "meta26-09",
    name: "Evo Goblin Bait / Exe Balloon / RG Monk / Giant Sparky",
    description: "Evo Goblin Bait · Executioner Balloon · Royal Giant Monk · Giant Sparky",
    decks: [
      {
        label: "Evo Goblin Bait",
        cards: [
          { name: "Goblin Barrel", isEvo: true }, { name: "Princess", isEvo: true },
          { name: "Dart Goblin" }, { name: "Goblin Gang" },
          { name: "Knight" }, { name: "The Log" },
          { name: "Inferno Tower" }, { name: "Arrows" },
        ],
      },
      {
        label: "Executioner Balloon",
        cards: [
          { name: "Executioner" }, { name: "Balloon" }, { name: "Miner" },
          { name: "Vines" }, { name: "Guards" }, { name: "Tornado" },
          { name: "Cannon" }, { name: "Ice Spirit" },
        ],
      },
      {
        label: "Royal Giant Monk",
        cards: [
          { name: "Royal Giant" }, { name: "Monk" }, { name: "Hunter" },
          { name: "Fisherman" }, { name: "Lightning" }, { name: "Electro Spirit" },
          { name: "Giant Snowball" }, { name: "Tombstone" },
        ],
      },
      {
        label: "Giant Sparky",
        cards: [
          { name: "Giant" }, { name: "Sparky" }, { name: "Mini P.E.K.K.A" },
          { name: "Skeleton Army" }, { name: "Minion Horde" }, { name: "Baby Dragon" },
          { name: "Fireball" }, { name: "Barbarian Barrel" },
        ],
      },
    ],
  },

  // Set 30 — 3.0 Miner / Evo Hog Musk / LavaLoon / Golem Bowler
  {
    id: "meta26-10",
    name: "3.0 Miner / Evo Hog / LavaLoon / Golem Bowler",
    description: "3.0 Miner Cycle · Evo Hog Musketeer · LavaLoon · Golem Bowler Poison",
    decks: [
      {
        label: "3.0 Miner Cycle",
        cards: [
          { name: "Miner" }, { name: "Wall Breakers" }, { name: "Goblin Gang" },
          { name: "Guards" }, { name: "Ice Spirit" }, { name: "The Log" },
          { name: "Electro Spirit" }, { name: "Giant Snowball" },
        ],
      },
      {
        label: "Evo Hog Musketeer",
        cards: [
          { name: "Hog Rider" }, { name: "Ice Golem" }, { name: "Musketeer" },
          { name: "Cannon", isEvo: true }, { name: "Fireball" }, { name: "Zap" },
          { name: "Skeletons", isEvo: true }, { name: "Heal Spirit" },
        ],
      },
      {
        label: "LavaLoon Bats",
        cards: [
          { name: "Lava Hound" }, { name: "Balloon" }, { name: "Inferno Dragon" },
          { name: "Skeleton Dragons" }, { name: "Lightning" }, { name: "Tombstone" },
          { name: "Arrows" }, { name: "Bats" },
        ],
      },
      {
        label: "Golem Bowler Poison",
        cards: [
          { name: "Golem" }, { name: "Bowler" }, { name: "Night Witch" },
          { name: "Baby Dragon" }, { name: "Tornado" }, { name: "Barbarian Barrel" },
          { name: "Lumberjack" }, { name: "Poison" },
        ],
      },
    ],
  },

  // Set 31 — Evo Hog / Goblin Drill / Evo PEKKA / Giant Graveyard
  {
    id: "meta26-11",
    name: "Evo Hog / Goblin Drill / Evo PEKKA / Giant Graveyard",
    description: "Evo Hog 2.6 · Goblin Drill Golden Knight · Evo PEKKA Bridge · Giant Graveyard",
    decks: [
      {
        label: "Evo Hog 2.6",
        cards: [
          { name: "Hog Rider" }, { name: "Ice Golem" }, { name: "Musketeer" },
          { name: "Cannon", isEvo: true }, { name: "Fireball" },
          { name: "Skeletons", isEvo: true }, { name: "Ice Spirit" }, { name: "The Log" },
        ],
      },
      {
        label: "Goblin Drill Golden Knight",
        cards: [
          { name: "Goblin Drill" }, { name: "Giant Snowball" }, { name: "Tesla" },
          { name: "Goblin Demolisher" }, { name: "Golden Knight" }, { name: "Poison" },
          { name: "Guards" }, { name: "Fire Spirit" },
        ],
      },
      {
        label: "Evo PEKKA Bridge",
        cards: [
          { name: "P.E.K.K.A", isEvo: true }, { name: "Battle Ram" }, { name: "Bandit" },
          { name: "Royal Ghost" }, { name: "Electro Wizard" }, { name: "Magic Archer" },
          { name: "Zap" }, { name: "Barbarian Barrel" },
        ],
      },
      {
        label: "Giant Graveyard",
        cards: [
          { name: "Giant" }, { name: "Graveyard" }, { name: "Bowler" },
          { name: "Baby Dragon" }, { name: "Skeleton Army" }, { name: "Lightning" },
          { name: "Tornado" }, { name: "Arrows" },
        ],
      },
    ],
  },

  // Set 32 — Royal Hogs / Miner Phoenix / LavaLoon / Golem Battle Ram
  {
    id: "meta26-12",
    name: "Royal Hogs / Miner Phoenix / LavaLoon / Golem",
    description: "Royal Hogs Archer Queen · Miner Phoenix Control · LavaLoon · Golem Battle Ram",
    decks: [
      {
        label: "Royal Hogs Archer Queen",
        cards: [
          { name: "Royal Hogs" }, { name: "Archer Queen" }, { name: "Tesla" },
          { name: "Ice Spirit" }, { name: "Earthquake" }, { name: "Skeletons" },
          { name: "The Log" }, { name: "Royal Delivery" },
        ],
      },
      {
        label: "Miner Phoenix Control",
        cards: [
          { name: "Miner" }, { name: "Phoenix" }, { name: "Golden Knight" },
          { name: "Goblin Curse" }, { name: "Guards" }, { name: "Zap" },
          { name: "Giant Snowball" }, { name: "Tombstone" },
        ],
      },
      {
        label: "LavaLoon Goblin Cage",
        cards: [
          { name: "Lava Hound" }, { name: "Balloon" }, { name: "Inferno Dragon" },
          { name: "Skeleton Dragons" }, { name: "Lightning" }, { name: "Minions" },
          { name: "Arrows" }, { name: "Goblin Cage" },
        ],
      },
      {
        label: "Golem Battle Ram",
        cards: [
          { name: "Golem" }, { name: "Battle Ram" }, { name: "Night Witch" },
          { name: "Lumberjack" }, { name: "Baby Dragon" }, { name: "Poison" },
          { name: "Tornado" }, { name: "Barbarian Barrel" },
        ],
      },
    ],
  },

  // Set 33 — Evo RG / Rocket Miner / Golem Electro Dragon / Goblin Barrel Cycle
  {
    id: "meta26-13",
    name: "Evo RG / Rocket Miner / Golem E-Dragon / Goblin Bait",
    description: "Evo Royal Giant · Rocket Miner Control · Golem Electro Dragon · Goblin Bait",
    decks: [
      {
        label: "Evo Royal Giant",
        cards: [
          { name: "Royal Giant", isEvo: true }, { name: "Fisherman" }, { name: "Monk" },
          { name: "Hunter" }, { name: "Lightning" }, { name: "Giant Snowball" },
          { name: "Electro Spirit" }, { name: "Tombstone" },
        ],
      },
      {
        label: "Rocket Miner Control",
        cards: [
          { name: "Miner" }, { name: "Rocket" }, { name: "Ice Wizard" },
          { name: "Valkyrie" }, { name: "Skeleton Army" }, { name: "Guards" },
          { name: "The Log" }, { name: "Wall Breakers" },
        ],
      },
      {
        label: "Golem Electro Dragon",
        cards: [
          { name: "Golem" }, { name: "Night Witch" }, { name: "Baby Dragon" },
          { name: "Lumberjack" }, { name: "Tornado" }, { name: "Barbarian Barrel" },
          { name: "Electro Dragon" }, { name: "Zap" },
        ],
      },
      {
        label: "Goblin Barrel Bait",
        cards: [
          { name: "Goblin Barrel" }, { name: "Princess" }, { name: "Dart Goblin" },
          { name: "Goblin Gang" }, { name: "Knight" }, { name: "Inferno Tower" },
          { name: "Arrows" }, { name: "Ice Spirit" },
        ],
      },
    ],
  },

  // Set 34 — Electro Giant / Graveyard Freeze / 2.6 Hog / Goblin Drill
  {
    id: "meta26-14",
    name: "Electro Giant / Graveyard Freeze / 2.6 Hog / Goblin Drill",
    description: "Electro Giant Tornado · Graveyard Freeze · 2.6 Hog Bats · Goblin Drill",
    decks: [
      {
        label: "Electro Giant Tornado",
        cards: [
          { name: "Electro Giant" }, { name: "Tornado" }, { name: "Lightning" },
          { name: "Miner" }, { name: "Zap" }, { name: "Bomber" },
          { name: "Guards" }, { name: "Electro Spirit" },
        ],
      },
      {
        label: "Graveyard Freeze",
        cards: [
          { name: "Graveyard" }, { name: "Witch" }, { name: "Knight" },
          { name: "Poison" }, { name: "Freeze" }, { name: "Ice Wizard" },
          { name: "Skeletons" }, { name: "Barbarian Barrel" },
        ],
      },
      {
        label: "2.6 Hog Bats",
        cards: [
          { name: "Hog Rider" }, { name: "Ice Golem" }, { name: "Musketeer" },
          { name: "Cannon" }, { name: "Fireball" }, { name: "The Log" },
          { name: "Ice Spirit" }, { name: "Bats" },
        ],
      },
      {
        label: "Goblin Drill Control",
        cards: [
          { name: "Goblin Drill" }, { name: "Giant Snowball" }, { name: "Tesla" },
          { name: "Goblin Demolisher" }, { name: "Golden Knight" }, { name: "Arrows" },
          { name: "Goblin Gang" }, { name: "Fire Spirit" },
        ],
      },
    ],
  },

  // Set 35 — Evo RG Fisherman / Miner Vines / Golem / Log Bait (June 2026)
  {
    id: "meta26-15",
    name: "Evo RG Fisherman / Miner Vines / Golem / Log Bait",
    description: "Evo Royal Giant Fisherman · Miner Vines Wall Breakers · Golem Night Witch · Log Bait",
    decks: [
      {
        label: "Evo Royal Giant Fisherman",
        cards: [
          { name: "Royal Giant", isEvo: true }, { name: "Fisherman" }, { name: "Hunter" },
          { name: "Monk" }, { name: "Fireball" }, { name: "Electro Spirit" },
          { name: "Giant Snowball" }, { name: "Tombstone" },
        ],
      },
      {
        label: "Miner Vines Wall Breakers",
        cards: [
          { name: "Miner" }, { name: "Wall Breakers" }, { name: "Mega Knight" },
          { name: "Goblin Gang" }, { name: "Guards" }, { name: "Vines" },
          { name: "Tornado" }, { name: "Zap" },
        ],
      },
      {
        label: "Golem Night Witch",
        cards: [
          { name: "Golem" }, { name: "Night Witch" }, { name: "Baby Dragon" },
          { name: "Lumberjack" }, { name: "Lightning" }, { name: "Skeleton Army" },
          { name: "Barbarian Barrel" }, { name: "Electro Dragon" },
        ],
      },
      {
        label: "Log Bait",
        cards: [
          { name: "Goblin Barrel" }, { name: "Princess" }, { name: "Dart Goblin" },
          { name: "Knight" }, { name: "The Log" }, { name: "Inferno Tower" },
          { name: "Arrows" }, { name: "Ice Spirit" },
        ],
      },
    ],
  },

  // Set 36 — Evo PEKKA Bridge / Miner Mega / LavaLoon / Furnace Cycle
  {
    id: "meta26-16",
    name: "Evo PEKKA Bridge / Miner Mega / LavaLoon / Furnace Cycle",
    description: "Evo PEKKA Bridge Spam · Miner Mega Knight Electro Dragon · LavaLoon · Furnace Cycle",
    decks: [
      {
        label: "Evo PEKKA Bridge",
        cards: [
          { name: "P.E.K.K.A", isEvo: true }, { name: "Battle Ram", isEvo: true },
          { name: "Bandit" }, { name: "Royal Ghost" },
          { name: "Magic Archer" }, { name: "Electro Wizard" },
          { name: "Goblin Curse" }, { name: "Zap" },
        ],
      },
      {
        label: "Miner Mega Knight",
        cards: [
          { name: "Miner" }, { name: "Wall Breakers" }, { name: "Mega Knight" },
          { name: "Goblin Gang" }, { name: "Guards" }, { name: "Tornado" },
          { name: "Giant Snowball" }, { name: "Electro Dragon" },
        ],
      },
      {
        label: "LavaLoon Guards",
        cards: [
          { name: "Lava Hound" }, { name: "Balloon" }, { name: "Inferno Dragon" },
          { name: "Skeleton Dragons" }, { name: "Lightning" }, { name: "Minions" },
          { name: "Arrows" }, { name: "Tombstone" },
        ],
      },
      {
        label: "Furnace Cycle",
        cards: [
          { name: "Furnace" }, { name: "Goblin Drill" }, { name: "Ice Spirit" },
          { name: "Skeletons" }, { name: "Knight" }, { name: "Barbarian Barrel" },
          { name: "Vines" }, { name: "Fireball" },
        ],
      },
    ],
  },

  // Set 37 — RG Monk / Goblin Barrel / Golem Tornado / Hog EQ (balanced)
  {
    id: "meta26-17",
    name: "RG Monk / Goblin Bait / Golem Tornado / Hog EQ",
    description: "Royal Giant Monk Lightning · Goblin Barrel Bait · Golem Tornado · Hog Earthquake",
    decks: [
      {
        label: "Royal Giant Monk",
        cards: [
          { name: "Royal Giant" }, { name: "Monk" }, { name: "Hunter" },
          { name: "Fisherman" }, { name: "Lightning" }, { name: "Electro Spirit" },
          { name: "Giant Snowball" }, { name: "Tombstone" },
        ],
      },
      {
        label: "Goblin Barrel Bait",
        cards: [
          { name: "Goblin Barrel" }, { name: "Princess" }, { name: "Dart Goblin" },
          { name: "Goblin Gang" }, { name: "Knight" }, { name: "The Log" },
          { name: "Ice Spirit" }, { name: "Inferno Tower" },
        ],
      },
      {
        label: "Golem Tornado",
        cards: [
          { name: "Golem" }, { name: "Night Witch" }, { name: "Baby Dragon" },
          { name: "Lumberjack" }, { name: "Tornado" }, { name: "Barbarian Barrel" },
          { name: "Skeleton Army" }, { name: "Arrows" },
        ],
      },
      {
        label: "Hog EQ Golden Knight",
        cards: [
          { name: "Hog Rider" }, { name: "Firecracker" }, { name: "Cannon" },
          { name: "Earthquake" }, { name: "Golden Knight" }, { name: "Skeletons" },
          { name: "Zap" }, { name: "Fireball" },
        ],
      },
    ],
  },

  // Set 38 — Evo Executioner / Phoenix Goblin Cage / Battle Ram / Mortar
  {
    id: "meta26-18",
    name: "Evo Executioner / Phoenix Cage / Battle Ram / Mortar",
    description: "Evo Executioner Balloon · Phoenix Goblin Cage · PEKKA Battle Ram · Mortar Bait",
    decks: [
      {
        label: "Evo Executioner Balloon",
        cards: [
          { name: "Executioner", isEvo: true }, { name: "Balloon" }, { name: "Miner" },
          { name: "Vines" }, { name: "Cannon", isEvo: true }, { name: "Ice Spirit" },
          { name: "Skeleton Army" }, { name: "Tornado" },
        ],
      },
      {
        label: "Phoenix Goblin Cage",
        cards: [
          { name: "Phoenix" }, { name: "Goblin Cage" }, { name: "Wall Breakers" },
          { name: "Giant Snowball" }, { name: "Lightning" }, { name: "Guards" },
          { name: "Zap" }, { name: "Tombstone" },
        ],
      },
      {
        label: "PEKKA Battle Ram",
        cards: [
          { name: "P.E.K.K.A" }, { name: "Battle Ram" }, { name: "Bandit" },
          { name: "Royal Ghost" }, { name: "Electro Wizard" }, { name: "Arrows" },
          { name: "Magic Archer" }, { name: "Barbarian Barrel" },
        ],
      },
      {
        label: "Mortar Bait",
        cards: [
          { name: "Mortar" }, { name: "Skeleton Barrel" }, { name: "Little Prince" },
          { name: "Berserker" }, { name: "Fireball" }, { name: "Goblin Gang" },
          { name: "Spear Goblins" }, { name: "The Log" },
        ],
      },
    ],
  },

  // Set 39 — Hog EQ / Giant Graveyard / Royal Hogs / Goblin Drill Boss
  {
    id: "meta26-19",
    name: "Hog EQ / Giant Graveyard / Royal Hogs / Goblin Drill",
    description: "Hog Earthquake Cycle · Giant Graveyard · Royal Hogs Archer Queen · Goblin Drill Boss",
    decks: [
      {
        label: "Hog Earthquake Cycle",
        cards: [
          { name: "Hog Rider" }, { name: "Firecracker" }, { name: "Cannon" },
          { name: "Earthquake" }, { name: "Ice Spirit" }, { name: "The Log" },
          { name: "Skeletons" }, { name: "Ice Golem" },
        ],
      },
      {
        label: "Giant Graveyard",
        cards: [
          { name: "Giant" }, { name: "Graveyard" }, { name: "Bowler" },
          { name: "Baby Dragon" }, { name: "Poison" }, { name: "Tombstone" },
          { name: "Arrows" }, { name: "Electro Wizard" },
        ],
      },
      {
        label: "Royal Hogs Archer Queen",
        cards: [
          { name: "Royal Hogs" }, { name: "Archer Queen" }, { name: "Fisherman" },
          { name: "Tesla" }, { name: "Royal Delivery" }, { name: "Barbarian Barrel" },
          { name: "Fireball" }, { name: "Electro Spirit" },
        ],
      },
      {
        label: "Goblin Drill Boss",
        cards: [
          { name: "Goblin Drill" }, { name: "Giant Snowball" }, { name: "Golden Knight" },
          { name: "Goblin Demolisher" }, { name: "Goblin Gang" }, { name: "Guards" },
          { name: "Zap" }, { name: "Rage" },
        ],
      },
    ],
  },

  // Set 40 — LavaLoon EQ / Evo Goblin Bait / PEKKA Poison / Golem Night Witch
  {
    id: "meta26-20",
    name: "LavaLoon / Evo Goblin Bait / PEKKA Poison / Golem",
    description: "LavaLoon Earthquake · Evo Goblin Bait · PEKKA Poison · Golem Night Witch",
    decks: [
      {
        label: "LavaLoon Earthquake",
        cards: [
          { name: "Lava Hound" }, { name: "Balloon" }, { name: "Inferno Dragon" },
          { name: "Skeleton Dragons" }, { name: "Lightning" }, { name: "Minions" },
          { name: "Arrows" }, { name: "Earthquake" },
        ],
      },
      {
        label: "Evo Goblin Bait",
        cards: [
          { name: "Goblin Barrel", isEvo: true }, { name: "Princess", isEvo: true },
          { name: "Dart Goblin" }, { name: "Goblin Gang" },
          { name: "Knight", isEvo: true }, { name: "The Log" },
          { name: "Giant Snowball" }, { name: "Inferno Tower" },
        ],
      },
      {
        label: "PEKKA Poison Bridge",
        cards: [
          { name: "P.E.K.K.A" }, { name: "Battle Ram" }, { name: "Bandit" },
          { name: "Royal Ghost" }, { name: "Electro Wizard" }, { name: "Magic Archer" },
          { name: "Poison" }, { name: "Barbarian Barrel" },
        ],
      },
      {
        label: "Golem Night Witch",
        cards: [
          { name: "Golem" }, { name: "Night Witch" }, { name: "Baby Dragon" },
          { name: "Lumberjack" }, { name: "Tombstone" }, { name: "Tornado" },
          { name: "Zap" }, { name: "Skeleton Army" },
        ],
      },
    ],
  },

  // ── COMPOSED SETS ──────────────────────────────────────────────────────────
  {
    id: "composed-hog-giant",
    name: "2.6 Hog / Giant Graveyard",
    description: "2.6 Hog cycle · Miner Poison · Giant Graveyard · Mortar cycle",
    decks: [
      {
        label: "2.6 Hog Cycle",
        cards: [
          { name: "Hog Rider" },
          { name: "Ice Golem" },
          { name: "Musketeer" },
          { name: "Cannon" },
          { name: "Fireball" },
          { name: "The Log" },
          { name: "Ice Spirit" },
          { name: "Skeletons" },
        ],
      },
      {
        label: "Miner Poison",
        cards: [
          { name: "Miner" },
          { name: "Inferno Dragon" },
          { name: "Giant Snowball" },
          { name: "Minions" },
          { name: "Goblin Gang" },
          { name: "Poison" },
          { name: "Electro Spirit" },
          { name: "Guards" },
        ],
      },
      {
        label: "Giant Graveyard",
        cards: [
          { name: "Giant" },
          { name: "Graveyard" },
          { name: "Bowler" },
          { name: "Baby Dragon" },
          { name: "Goblin Barrel" },
          { name: "Tornado" },
          { name: "Arrows" },
          { name: "Electro Wizard" },
        ],
      },
      {
        label: "Mortar Cycle",
        cards: [
          { name: "Mortar" },
          { name: "Knight" },
          { name: "Archers" },
          { name: "Spear Goblins" },
          { name: "Royal Delivery" },
          { name: "Barbarian Barrel" },
          { name: "Tesla" },
          { name: "Zap" },
        ],
      },
    ],
  },
  {
    id: "composed-lava-bridge",
    name: "Lava Loon / Bridge Spam",
    description: "Lava Loon · Pekka Bridge Spam · Miner Wall Breakers · Royal Giant",
    decks: [
      {
        label: "Lava Loon",
        cards: [
          { name: "Lava Hound" },
          { name: "Balloon" },
          { name: "Lumberjack" },
          { name: "Skeleton Dragons" },
          { name: "Lightning" },
          { name: "Tombstone" },
          { name: "Zap" },
          { name: "Minions" },
        ],
      },
      {
        label: "Pekka Bridge Spam",
        cards: [
          { name: "P.E.K.K.A" },
          { name: "Bandit" },
          { name: "Battle Ram" },
          { name: "Electro Wizard" },
          { name: "Fireball" },
          { name: "Arrows" },
          { name: "Ice Spirit" },
          { name: "Magic Archer" },
        ],
      },
      {
        label: "Miner Wall Breakers",
        cards: [
          { name: "Miner" },
          { name: "Wall Breakers" },
          { name: "Mega Knight" },
          { name: "Electro Dragon" },
          { name: "Electro Spirit" },
          { name: "Guards" },
          { name: "The Log" },
          { name: "Giant Snowball" },
        ],
      },
      {
        label: "Royal Giant Fisherman",
        cards: [
          { name: "Royal Giant" },
          { name: "Fisherman" },
          { name: "Cannon" },
          { name: "Valkyrie" },
          { name: "Skeleton Army" },
          { name: "Barbarian Barrel" },
          { name: "Earthquake" },
          { name: "Ice Golem" },
        ],
      },
    ],
  },
  {
    id: "composed-skeleton-king",
    name: "Skeleton King Control",
    description: "Skeleton King Hogs · Miner Poison cycle · Golem Night Witch · Mortar",
    decks: [
      {
        label: "Skeleton King Royal Hogs",
        cards: [
          { name: "Skeleton King" },
          { name: "Royal Hogs" },
          { name: "Cannon Cart" },
          { name: "Goblin Machine" },
          { name: "Goblin Gang" },
          { name: "Dart Goblin" },
          { name: "Barbarian Barrel" },
          { name: "Giant Snowball" },
        ],
      },
      {
        label: "Miner Poison Cycle",
        cards: [
          { name: "Miner" },
          { name: "Musketeer" },
          { name: "Goblin Drill" },
          { name: "Tornado" },
          { name: "Guards" },
          { name: "Poison" },
          { name: "Electro Spirit" },
          { name: "Zap" },
        ],
      },
      {
        label: "Golem Night Witch",
        cards: [
          { name: "Golem" },
          { name: "Night Witch" },
          { name: "Baby Dragon" },
          { name: "Knight" },
          { name: "Skeleton Army" },
          { name: "Arrows" },
          { name: "Tombstone" },
          { name: "Lumberjack" },
        ],
      },
      {
        label: "Mortar Control",
        cards: [
          { name: "Mortar" },
          { name: "Tesla" },
          { name: "Ice Spirit" },
          { name: "Skeletons" },
          { name: "The Log" },
          { name: "Fireball" },
          { name: "Royal Ghost" },
          { name: "Witch" },
        ],
      },
    ],
  },
  {
    id: "composed-electro-giant",
    name: "Electro Giant / Golem",
    description: "Goblin Barrel cycle · 2.6 Hog · Electro Giant · Golem Night Witch",
    decks: [
      {
        label: "Goblin Barrel Cycle",
        cards: [
          { name: "Golden Knight" },
          { name: "Skeleton Barrel" },
          { name: "Goblin Barrel" },
          { name: "Princess" },
          { name: "Goblin Gang" },
          { name: "Dart Goblin" },
          { name: "The Log" },
          { name: "Giant Snowball" },
        ],
      },
      {
        label: "Hog Cycle",
        cards: [
          { name: "Hog Rider" },
          { name: "Musketeer" },
          { name: "Tesla" },
          { name: "Cannon" },
          { name: "Fireball" },
          { name: "Barbarian Barrel" },
          { name: "Ice Spirit" },
          { name: "Skeletons" },
        ],
      },
      {
        label: "Electro Giant",
        cards: [
          { name: "Electro Giant" },
          { name: "Tornado" },
          { name: "Lightning" },
          { name: "Miner" },
          { name: "Bomber" },
          { name: "Electro Spirit" },
          { name: "Guards" },
          { name: "Zap" },
        ],
      },
      {
        label: "Golem Night Witch",
        cards: [
          { name: "Golem" },
          { name: "Night Witch" },
          { name: "Baby Dragon" },
          { name: "Lumberjack" },
          { name: "Skeleton Army" },
          { name: "Arrows" },
          { name: "Rage" },
          { name: "Mega Knight" },
        ],
      },
    ],
  },
];
