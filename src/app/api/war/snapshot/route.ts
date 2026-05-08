import { getRiverRaceLog } from '@/lib/cr-api'
import { supabase } from '@/lib/supabase'

const CLAN_TAG = '#QPRQ88YP'

export async function GET() {
  return handler()
}

export async function POST() {
  return handler()
}

async function handler() {
  try {
    const log = await getRiverRaceLog()
    const races = log?.items ?? []

    let inserted = 0
    let skipped = 0

    for (const race of races) {
      const { seasonId, sectionIndex, createdDate } = race
      const ourEntry = race.standings?.find(
        (s: { clan: { tag: string } }) => s.clan?.tag === CLAN_TAG
      )
      if (!ourEntry) { skipped++; continue }

      // Check if already stored
      const { data: existing } = await supabase
        .from('war_snapshots')
        .select('id')
        .eq('season_id', seasonId)
        .eq('section_index', sectionIndex)
        .maybeSingle()

      if (existing) { skipped++; continue }

      const y = createdDate.slice(0, 4)
      const mo = createdDate.slice(4, 6)
      const d = createdDate.slice(6, 8)
      const snapshotDate = `${y}-${mo}-${d}T00:00:00Z`

      // Insert snapshot
      const { data: snapshot, error: snapErr } = await supabase
        .from('war_snapshots')
        .insert({
          season_id: seasonId,
          section_index: sectionIndex,
          snapshotted_at: snapshotDate,
          raw_data: race,
        })
        .select('id')
        .single()

      if (snapErr || !snapshot) {
        console.error('Snapshot insert error:', snapErr)
        continue
      }

      // Insert per-member stats
      const participants = ourEntry.clan?.participants ?? []
      const memberRows = participants.map((p: {
        tag: string; name: string; fame: number;
        repairPoints: number; boatAttacks: number; decksUsed: number
      }) => ({
        snapshot_id: snapshot.id,
        player_tag: p.tag,
        player_name: p.name,
        fame: p.fame,
        repair_points: p.repairPoints,
        boat_attacks: p.boatAttacks,
        decks_used: p.decksUsed,
      }))

      if (memberRows.length > 0) {
        const { error: memberErr } = await supabase
          .from('war_member_stats')
          .insert(memberRows)

        if (memberErr) console.error('Member stats insert error:', memberErr)
      }

      inserted++
    }

    return Response.json({
      success: true,
      inserted,
      skipped,
      message: `Saved ${inserted} new race(s), skipped ${skipped} already stored`,
    })
  } catch (err) {
    console.error('Snapshot error:', err)
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}
