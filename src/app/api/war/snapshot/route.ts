import { getRiverRaceLog } from '@/lib/cr-api'
import { supabase } from '@/lib/supabase'
import {
  notifyWarResults,
  notifyPerfectWar,
  notifyMissedBattles,
  notifyPromotions,
} from '@/lib/discord-notify'

const CLAN_TAG = '#QPRQ88YP'
const POST_BASELINE_CUTOFF = '2026-05-05T00:00:00Z'

export async function GET() { return handler() }
export async function POST() { return handler() }

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

      const participants: Array<{
        tag: string; name: string; fame: number;
        repairPoints: number; boatAttacks: number; decksUsed: number
      }> = ourEntry.clan?.participants ?? []

      const memberRows = participants.map(p => ({
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

      // Fire Discord notifications for this newly saved war (don't block response)
      fireWarNotifications(participants, seasonId, sectionIndex, snapshotDate).catch(
        err => console.error('Discord war notifications failed:', err)
      )
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

async function fireWarNotifications(
  participants: Array<{ tag: string; name: string; fame: number; decksUsed: number }>,
  seasonId: number,
  sectionIndex: number,
  snapshotDate: string,
) {
  const totalFame = participants.reduce((s, p) => s + p.fame, 0)

  await Promise.allSettled([
    notifyWarResults(participants, seasonId, sectionIndex),
    notifyPerfectWar(participants, totalFame),
    notifyMissedBattles(participants),
  ])

  // Promotions: compute cumulative fame per member and check for rank-ups
  if (snapshotDate >= POST_BASELINE_CUTOFF) {
    await checkAndNotifyPromotions(participants)
  }
}

async function checkAndNotifyPromotions(
  newParticipants: Array<{ tag: string; name: string; fame: number }>
) {
  const tags = newParticipants.map(p => p.tag)

  // Get fame baseline
  const { data: baselineRows } = await supabase
    .from('fame_baseline')
    .select('player_tag, baseline_fame')
    .in('player_tag', tags)

  const baselineByTag = new Map<string, number>(
    (baselineRows ?? []).map(r => [r.player_tag, r.baseline_fame])
  )

  // Get all historical war fame for these members
  const { data: allSnapshots } = await supabase
    .from('war_snapshots')
    .select('id')
    .gte('snapshotted_at', POST_BASELINE_CUTOFF)

  const snapshotIds = (allSnapshots ?? []).map(s => s.id)

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

  const membersWithFame = newParticipants.map(p => ({
    tag: p.tag,
    name: p.name,
    fame: (baselineByTag.get(p.tag) ?? 0) + (historicalByTag.get(p.tag) ?? 0),
  }))

  await notifyPromotions(membersWithFame)
}
