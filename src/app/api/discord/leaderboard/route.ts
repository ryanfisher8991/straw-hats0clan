import { getClanMembers } from '@/lib/cr-api'
import { supabase } from '@/lib/supabase'
import { notifyLeaderboard } from '@/lib/discord-notify'

const POST_BASELINE_CUTOFF = '2026-05-05T00:00:00Z'

export async function GET()  { return handler() }
export async function POST() { return handler() }

async function handler() {
  try {
    const membersRes = await getClanMembers()
    const members: Array<{ tag: string; name: string }> = membersRes?.items ?? []

    if (!members.length) {
      return Response.json({ error: 'No members from CR API' }, { status: 500 })
    }

    const tags = members.map(m => m.tag)

    // Baseline fame
    const { data: baselineRows } = await supabase
      .from('fame_baseline')
      .select('player_tag, baseline_fame')
      .in('player_tag', tags)

    const baselineByTag = new Map<string, number>(
      (baselineRows ?? []).map(r => [r.player_tag, r.baseline_fame])
    )

    // Historical war fame
    const { data: snapshots } = await supabase
      .from('war_snapshots')
      .select('id')
      .gte('snapshotted_at', POST_BASELINE_CUTOFF)

    const snapshotIds = (snapshots ?? []).map(s => s.id)
    const historicalByTag = new Map<string, number>()

    if (snapshotIds.length > 0) {
      const { data: stats } = await supabase
        .from('war_member_stats')
        .select('player_tag, fame')
        .in('snapshot_id', snapshotIds)
        .in('player_tag', tags)

      for (const row of stats ?? []) {
        historicalByTag.set(row.player_tag, (historicalByTag.get(row.player_tag) ?? 0) + row.fame)
      }
    }

    const membersWithFame = members.map(m => ({
      tag: m.tag,
      name: m.name,
      fame: (baselineByTag.get(m.tag) ?? 0) + (historicalByTag.get(m.tag) ?? 0),
    }))

    await notifyLeaderboard(membersWithFame)

    return Response.json({ ok: true, members: membersWithFame.length })
  } catch (err) {
    console.error('Leaderboard error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
