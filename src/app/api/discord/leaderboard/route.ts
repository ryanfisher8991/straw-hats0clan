import { supabase } from '@/lib/supabase'
import { notifyLeaderboard } from '@/lib/discord-notify'

export async function GET()  { return handler() }
export async function POST() { return handler() }

async function handler() {
  try {
    // Get the most recent war snapshot
    const { data: snapshot } = await supabase
      .from('war_snapshots')
      .select('id, snapshotted_at')
      .order('snapshotted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!snapshot) {
      return Response.json({ skipped: true, reason: 'No war snapshots yet' })
    }

    // Get member stats for that snapshot only
    const { data: stats } = await supabase
      .from('war_member_stats')
      .select('player_tag, player_name, fame')
      .eq('snapshot_id', snapshot.id)
      .order('fame', { ascending: false })

    if (!stats?.length) {
      return Response.json({ skipped: true, reason: 'No member stats for latest snapshot' })
    }

    const members = stats.map(r => ({
      tag: r.player_tag,
      name: r.player_name,
      fame: r.fame,
    }))

    await notifyLeaderboard(members)
    return Response.json({ ok: true, members: members.length, snapshot: snapshot.snapshotted_at })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
