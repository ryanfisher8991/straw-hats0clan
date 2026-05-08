export interface ClanMember {
  tag: string
  name: string
  role: 'member' | 'elder' | 'coLeader' | 'leader'
  expLevel: number
  trophies: number
  arena: { id: number; name: string }
  clanRank: number
  previousClanRank: number
  donations: number
  donationsReceived: number
  clanChestPoints: number
  lastSeen: string
}

export interface Clan {
  tag: string
  name: string
  type: string
  description: string
  badgeId: number
  clanScore: number
  clanWarTrophies: number
  location: { id: number; name: string; isCountry: boolean }
  requiredTrophies: number
  donationsPerWeek: number
  memberCount: number
  members: ClanMember[]
}

export interface PlayerCard {
  name: string
  id: number
  level: number
  starLevel?: number
  evolutionLevel?: number
  maxLevel: number
  count: number
  iconUrls: { medium: string }
}

export interface Player {
  tag: string
  name: string
  expLevel: number
  trophies: number
  bestTrophies: number
  wins: number
  losses: number
  battleCount: number
  cards: PlayerCard[]
  currentDeck: PlayerCard[]
  clan?: { tag: string; name: string }
}

export interface RiverRaceParticipant {
  tag: string
  name: string
  fame: number
  repairPoints: number
  boatAttacks: number
  decksUsed: number
  decksUsedToday: number
}

export interface RiverRaceClan {
  tag: string
  name: string
  fame: number
  repairPoints: number
  finishTime?: string
  participants: RiverRaceParticipant[]
}

export interface RiverRace {
  state: string
  clan: RiverRaceClan
  clans: RiverRaceClan[]
  seasonId: number
  sectionIndex: number
  periodIndex: number
  periodType: string
}

export interface MetaDeck {
  id: string
  name: string
  cards: string[]
  archetype: string
  avg_elixir: number
  created_at: string
}

export interface ScoredDeck extends MetaDeck {
  score: number
  missingCards: string[]
  underleveledCards: { name: string; current: number; recommended: number }[]
}
