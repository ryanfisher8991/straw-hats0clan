import { getRiverRaceLog } from '@/lib/cr-api'
import { supabase } from '@/lib/supabase'
import {
  notifyWarResults,
  notifyPerfectWar,
  notifyMissedBattles,
  notifyPromotions,
  notifyInactiveMembers,
  notifyKickRecommendation,
} from '@/lib/discord-notify'
import { syncMemberRoles } from '@/lib/discord-roles'
import { getLifetimeFameMap } from '@/lib/fame'

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

  // Low fame alert — members below the per-war threshold. Skip anyone whose
  // low fame is from 0 decks used on their first-ever recorded war — that's
  // "joined too late this week to battle," not inactivity.
  const { data: fameCfg } = await supabase
    .from("discord_config").select("value").eq("key", "low_fame_threshold").maybeSingle()
  const lowFameThreshold = parseInt(fameCfg?.value ?? "850", 10)

  const { data: allWarCounts } = await supabase
    .from("war_member_stats")
    .select("player_tag")
    .in("player_tag", participants.map(p => p.tag))
  const warCountByTag = new Map<string, number>()
  for (const row of allWarCounts ?? []) {
    warCountByTag.set(row.player_tag, (warCountByTag.get(row.player_tag) ?? 0) + 1)
  }

  const lowFame = participants.filter(p => {
    if (p.fame >= lowFameThreshold) return false
    const isFirstWarEver = (warCountByTag.get(p.tag) ?? 0) <= 1
    if (isFirstWarEver && p.decksUsed === 0) return false
    return true
  })
  if (lowFame.length > 0) {
    await notifyInactiveMembers(
      lowFame.map(p => ({ name: p.name, tag: p.tag, donations: 0, recentFame: p.fame })),
      lowFameThreshold,
    ).catch(console.error)
  }

  // Kick recommendation — members with avg fame below threshold over last 5 wars
  const { data: kickCfg } = await supabase
    .from("discord_config").select("value").eq("key", "kick_avg_threshold").maybeSingle()
  const kickThreshold = parseInt(kickCfg?.value ?? "1700", 10)

  const { data: snapshots } = await supabase
    .from("war_snapshots").select("id, snapshotted_at").order("snapshotted_at", { ascending: true }).limit(5)
  if (snapshots && snapshots.length >= 2) {
    const snapshotOrder = new Map(snapshots.map((s, i) => [s.id, i]))
    const { data: stats } = await supabase
      .from("war_member_stats")
      .select("player_tag, player_name, fame, decks_used, snapshot_id")
      .in("snapshot_id", snapshots.map(s => s.id))
      .in("player_tag", participants.map(p => p.tag))

    const memberWars = new Map<string, { name: string; entries: Array<{ fame: number; decksUsed: number; order: number }> }>()
    for (const stat of stats ?? []) {
      if (!memberWars.has(stat.player_tag))
        memberWars.set(stat.player_tag, { name: stat.player_name, entries: [] })
      memberWars.get(stat.player_tag)!.entries.push({
        fame: stat.fame,
        decksUsed: stat.decks_used,
        order: snapshotOrder.get(stat.snapshot_id) ?? 0,
      })
    }

    // Same "joined too late to battle" exclusion as the low-fame alert above
    for (const member of memberWars.values()) {
      member.entries.sort((a, b) => a.order - b.order)
      if (member.entries[0]?.decksUsed === 0) {
        member.entries.shift()
      }
    }

    const kickCandidates = [...memberWars.entries()]
      .filter(([, v]) => v.entries.length >= 2)
      .map(([tag, v]) => ({
        tag, name: v.name, warsChecked: v.entries.length,
        avgFame: Math.round(v.entries.reduce((s, e) => s + e.fame, 0) / v.entries.length),
      }))
      .filter(m => m.avgFame < kickThreshold)
      .sort((a, b) => a.avgFame - b.avgFame)

    if (kickCandidates.length > 0) {
      await notifyKickRecommendation(kickCandidates, kickThreshold).catch(console.error)
    }
  }

  // Sync Discord roles for all registered members (fame tiers may have changed)
  syncWarRoles(participants).catch(console.error)
}

async function syncWarRoles(participants: Array<{ tag: string; name: string }>) {
  const { data: registered } = await supabase
    .from('discord_members')
    .select('discord_user_id, player_tag, clan_role')
    .in('player_tag', participants.map(p => p.tag))

  if (!registered?.length) return

  const fameMap = await getLifetimeFameMap(participants.map(p => ({ tag: p.tag, name: p.name })))

  for (const row of registered) {
    const totalFame = fameMap.get(row.player_tag) ?? 0
    await syncMemberRoles(row.discord_user_id, row.clan_role ?? 'member', totalFame).catch(console.error)
    await new Promise(r => setTimeout(r, 250))
  }
}

async function checkAndNotifyPromotions(
  newParticipants: Array<{ tag: string; name: string; fame: number }>
) {
  // Only process members actually in the clan right now
  const { getClanMembers } = await import('@/lib/cr-api')
  const clanData = await getClanMembers()
  const activeTags = new Set<string>((clanData?.items ?? []).map((m: { tag: string }) => m.tag))
  const activePart = newParticipants.filter(p => activeTags.has(p.tag))
  if (!activePart.length) return

  const tags = activePart.map(p => p.tag)

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

  const membersWithFame = activePart.map(p => ({
    tag: p.tag,
    name: p.name,
    fame: (baselineByTag.get(p.tag) ?? 0) + (historicalByTag.get(p.tag) ?? 0),
  }))

  await notifyPromotions(membersWithFame)
}
