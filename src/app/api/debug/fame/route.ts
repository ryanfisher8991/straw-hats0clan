import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = (searchParams.get('name') ?? 'Jabben28').toLowerCase()

  const { data: snapshots } = await supabase
    .from('war_snapshots')
    .select('id, season_id, section_index, snapshotted_at')
    .order('snapshotted_at', { ascending: true })

  const snapshotIds = (snapshots ?? []).map((s: { id: string }) => s.id)

  const { data: stats } = snapshotIds.length
    ? await supabase
        .from('war_member_stats')
        .select('snapshot_id, player_name, player_tag, fame')
        .ilike('player_name', `%${name}%`)
    : { data: [] }

  const { data: baseline } = await supabase
    .from('fame_baseline')
    .select('player_name, player_tag, baseline_fame')
    .ilike('player_name', `%${name}%`)

  const snapshotMap = Object.fromEntries(
    (snapshots ?? []).map((s: { id: string; season_id: number; section_index: number; snapshotted_at: string }) => [
      s.id,
      { season_id: s.season_id, section_index: s.section_index, snapshotted_at: s.snapshotted_at },
    ])
  )

  const enriched = (stats ?? []).map((r: { snapshot_id: string; player_name: string; player_tag: string; fame: number }) => ({
    ...r,
    snapshot: snapshotMap[r.snapshot_id],
  }))

  return Response.json({ baseline, war_member_stats: enriched, all_snapshots: snapshots })
}
