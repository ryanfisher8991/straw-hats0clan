import { getClanMembers } from '@/lib/cr-api'
import { supabase } from '@/lib/supabase'
import { notifyNewMembers } from '@/lib/discord-notify'

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
      .gte('created_at', cutoff)

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

    return Response.json({ saved: rows.length, newMembers: newMembers.length })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
