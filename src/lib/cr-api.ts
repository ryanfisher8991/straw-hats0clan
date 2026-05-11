const CLAN_TAG = process.env.NEXT_PUBLIC_CLAN_TAG!
const CR_API_KEY = process.env.CLASH_ROYALE_API_KEY!
const CR_BASE = 'https://api.clashroyale.com/v1'
const CR_PROXY = 'https://proxy.royaleapi.dev/v1'

function encodeTag(tag: string) {
  return encodeURIComponent(`#${tag.replace('#', '')}`)
}

async function crFetch(path: string) {
  const isDev = process.env.NODE_ENV === 'development'
  const base = isDev ? CR_BASE : CR_PROXY

  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${CR_API_KEY}` },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`CR API error ${res.status}: ${path}`)
  return res.json()
}

export function getClan() {
  return crFetch(`/clans/${encodeTag(CLAN_TAG)}`)
}

export function getClanMembers() {
  return crFetch(`/clans/${encodeTag(CLAN_TAG)}/members`)
}

export function getCurrentRiverRace() {
  return crFetch(`/clans/${encodeTag(CLAN_TAG)}/currentriverrace`)
}

export function getRiverRaceLog() {
  return crFetch(`/clans/${encodeTag(CLAN_TAG)}/riverracelog`)
}

export function getPlayer(tag: string) {
  return crFetch(`/players/${encodeTag(tag)}`)
}

export function getAllCards() {
  return crFetch(`/cards`)
}

export async function getClanLocalRank(): Promise<{ rank: number; previousRank: number; locationName: string } | null> {
  const LOCATION_ID = 57000001
  try {
    // Try clan wars ranking first (what's shown in-game as war rank)
    const warRes = await crFetch(`/locations/${LOCATION_ID}/rankings/clanwars?limit=1000`)
    const warEntry = warRes.items?.find((c: { tag: string }) => c.tag === `#${CLAN_TAG}`)
    if (warEntry) {
      return { rank: warEntry.rank, previousRank: warEntry.previousRank ?? warEntry.rank, locationName: warEntry.location?.name ?? 'North America' }
    }
    // Fall back to clan score ranking
    const scoreRes = await crFetch(`/locations/${LOCATION_ID}/rankings/clans?limit=1000`)
    const scoreEntry = scoreRes.items?.find((c: { tag: string }) => c.tag === `#${CLAN_TAG}`)
    if (!scoreEntry) return null
    return { rank: scoreEntry.rank, previousRank: scoreEntry.previousRank ?? scoreEntry.rank, locationName: scoreEntry.location?.name ?? 'North America' }
  } catch {
    return null
  }
}
