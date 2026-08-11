import { supabase } from '@/lib/supabase'

export interface WarEntry {
  snapshotId: string
  seasonId: number
  sectionIndex: number
  date: string
  fame: number
  decksUsed: number
  decksMissed: number
  excludedFromAverage?: boolean
}

export interface MemberAnalysis {
  tag: string
  name: string
  wars: WarEntry[]
  avgFame: number
  avgDecksMissed: number
  avgDecksUsed: number
  warsCount: number
}

export async function GET() {
  try {
    // Only use completed war snapshots — never current/live war data
    const { data: snapshots, error: snapErr } = await supabase
      .from('war_snapshots')
      .select('id, season_id, section_index, snapshotted_at')
      .order('snapshotted_at', { ascending: false })
      .limit(10)

    if (snapErr) throw snapErr
    if (!snapshots?.length) {
      return Response.json({ members: [], snapshotCount: 0 })
    }

    const snapshotIds = snapshots.map((s) => s.id)

    const { data: stats, error: statsErr } = await supabase
      .from('war_member_stats')
      .select('snapshot_id, player_tag, player_name, fame, decks_used')
      .in('snapshot_id', snapshotIds)

    if (statsErr) throw statsErr

    const snapshotMap = new Map(
      snapshots.map((s) => [
        s.id,
        { seasonId: s.season_id, sectionIndex: s.section_index, date: s.snapshotted_at },
      ])
    )

    const memberMap = new Map<string, { tag: string; name: string; wars: WarEntry[] }>()

    for (const stat of stats ?? []) {
      const snap = snapshotMap.get(stat.snapshot_id)
      if (!snap) continue

      if (!memberMap.has(stat.player_tag)) {
        memberMap.set(stat.player_tag, { tag: stat.player_tag, name: stat.player_name, wars: [] })
      }

      memberMap.get(stat.player_tag)!.wars.push({
        snapshotId: stat.snapshot_id,
        seasonId: snap.seasonId,
        sectionIndex: snap.sectionIndex,
        date: snap.date,
        fame: stat.fame,
        decksUsed: stat.decks_used,
        decksMissed: Math.max(0, 16 - stat.decks_used),
      })
    }

    const members: MemberAnalysis[] = Array.from(memberMap.values())
      .map((member) => {
        const wars = [...member.wars].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        // Any war with 0 decks used means they weren't actually around to
        // battle that week — joined late, left early, or were out of the
        // clan entirely but still appear in that war's participant list.
        // Exclude those from the averages (still shown in their history).
        for (const w of wars) {
          if (w.decksUsed === 0) w.excludedFromAverage = true
        }

        const countedWars = wars.filter((w) => !w.excludedFromAverage)
        const avgFame = countedWars.length
          ? Math.round(countedWars.reduce((s, w) => s + w.fame, 0) / countedWars.length)
          : 0
        const avgDecksMissed = countedWars.length
          ? Math.round((countedWars.reduce((s, w) => s + w.decksMissed, 0) / countedWars.length) * 10) / 10
          : 0
        const avgDecksUsed = countedWars.length
          ? Math.round((countedWars.reduce((s, w) => s + w.decksUsed, 0) / countedWars.length) * 10) / 10
          : 0
        return { tag: member.tag, name: member.name, wars, avgFame, avgDecksMissed, avgDecksUsed, warsCount: countedWars.length }
      })
      .sort((a, b) => b.avgFame - a.avgFame)

    return Response.json({ members, snapshotCount: snapshots.length })
  } catch (err) {
    console.error('War analysis error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
