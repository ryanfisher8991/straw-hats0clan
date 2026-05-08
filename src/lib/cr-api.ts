const CLAN_TAG = process.env.NEXT_PUBLIC_CLAN_TAG!
const CR_API_KEY = process.env.CLASH_ROYALE_API_KEY!
const CR_BASE = 'https://api.clashroyale.com/v1'
const CF_WORKER_URL = 'https://wandering-moon-5de6.ryanfisher8991.workers.dev'

function encodeTag(tag: string) {
  return encodeURIComponent(`#${tag.replace('#', '')}`)
}

async function crFetch(path: string) {
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    const res = await fetch(`${CR_BASE}${path}`, {
      headers: { Authorization: `Bearer ${CR_API_KEY}` },
      next: { revalidate: 300 },
    })
    if (!res.ok) throw new Error(`CR API error ${res.status}: ${path}`)
    return res.json()
  }

  const res = await fetch(`${CF_WORKER_URL}/?path=${encodeURIComponent(path)}`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`CF proxy error ${res.status}: ${path}`)
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
    const res = await crFetch(`/locations/${LOCATION_ID}/rankings/clans?limit=200`)
    const entry = res.items?.find((c: { tag: string }) => c.tag === `#${CLAN_TAG}`)
    if (!entry) return null
    return { rank: entry.rank, previousRank: entry.previousRank, locationName: entry.location?.name ?? 'North America' }
  } catch {
    return null
  }
}
