import { getPlayer } from '@/lib/cr-api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag') ?? 'QPRQ88YP'
  try {
    const player = await getPlayer(tag)
    // Return just the first 3 cards to see the shape
    // Group one card per rarity so we can verify level offsets
    const byRarity: Record<string, { name: string; apiLevel: number; maxLevel: number; maxEvolutionLevel?: number }> = {};
    for (const c of player.cards ?? []) {
      const r = (c.rarity ?? 'unknown').toLowerCase();
      if (!byRarity[r]) byRarity[r] = { name: c.name, apiLevel: c.level, maxLevel: c.maxLevel, maxEvolutionLevel: c.maxEvolutionLevel };
    }
    return Response.json({ name: player.name, cardCount: player.cards?.length, onePerRarity: byRarity })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
