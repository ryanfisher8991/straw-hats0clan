import { getClanMembers } from '@/lib/cr-api'
import { supabase } from '@/lib/supabase'
import { notifyNewMembers } from '@/lib/discord-notify'
import { syncMemberRoles, FAME_TIERS } from '@/lib/discord-roles'

export async function POST() { return handler() }
export async function GET()  { return handler() }

async function handler() {
  try {
    const res = await getClanMembers()
    const members: Array<{ tag: string; name: string; trophies: number; donations: number }> =
      res?.items ?? []

    if (!members.length) {
      return Response.json({ error: 'No members returned from CR API' }, { status: 500 })
    }

    // Detect new members: find tags not seen in the last 30 days
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentTags } = await supabase
      .from('member_snapshots')
      .select('player_tag')
      .gte('snapshotted_at', cutoff)

    const knownTags = new Set((recentTags ?? []).map(r => r.player_tag))
    const newMembers = members.filter(m => !knownTags.has(m.tag))

    // Save snapshot
    const rows = members.map(m => ({
      player_tag: m.tag,
      player_name: m.name,
      trophies: m.trophies,
      donations: m.donations,
    }))

    const { error } = await supabase.from('member_snapshots').insert(rows)
    if (error) return Response.json({ error: error.message }, { status: 500 })

    // Notify new members (non-blocking)
    if (newMembers.length > 0) {
      notifyNewMembers(
        newMembers.map(m => ({ name: m.name, trophies: m.trophies })),
        members.length
      ).catch(err => console.error('Welcome notification failed:', err))
    }

    // Sync Discord roles for all registered members (non-blocking)
    syncDiscordRoles(members).catch(err => console.error('Role sync failed:', err))

    return Response.json({ saved: rows.length, newMembers: newMembers.length })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}

async function syncDiscordRoles(members: Array<{ tag: string; role?: string }>) {
  const { data: registered } = await supabase
    .from('discord_members')
    .select('discord_user_id, player_tag')

  if (!registered?.length) return

  const clanRoleByTag = new Map(members.map(m => [m.tag, m.role ?? 'member']))

  const tags = registered.map(r => r.player_tag)
  const [baselineRes, statsRes] = await Promise.all([
    supabase.from('fame_baseline').select('player_tag, baseline_fame').in('player_tag', tags),
    supabase.from('war_member_stats').select('player_tag, fame').in('player_tag', tags),
  ])

  const fameMap = new Map<string, number>()
  for (const r of baselineRes.data ?? []) fameMap.set(r.player_tag, (fameMap.get(r.player_tag) ?? 0) + r.baseline_fame)
  for (const r of statsRes.data ?? [])    fameMap.set(r.player_tag, (fameMap.get(r.player_tag) ?? 0) + r.fame)

  for (const row of registered) {
    const inClan    = clanRoleByTag.has(row.player_tag)
    const clanRole  = clanRoleByTag.get(row.player_tag) ?? 'member'
    const totalFame = fameMap.get(row.player_tag) ?? 0

    // Only overwrite the stored clan_role while they're actually in the clan —
    // leave it alone while Out of Clan so a rejoin restores the last-known rank.
    if (inClan) {
      await supabase.from('discord_members')
        .update({ clan_role: clanRole, updated_at: new Date().toISOString() })
        .eq('discord_user_id', row.discord_user_id)
    }
    await syncMemberRoles(row.discord_user_id, clanRole, totalFame, inClan)
    await new Promise(r => setTimeout(r, 250))
  }
}
