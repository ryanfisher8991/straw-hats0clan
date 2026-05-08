import { getClanMembers } from '@/lib/cr-api'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    const res = await getClanMembers()
    const members = res?.items ?? []

    if (!members.length) {
      return Response.json({ error: 'No members returned from CR API' }, { status: 500 })
    }

    const rows = members.map((m: { tag: string; name: string; trophies: number; donations: number }) => ({
      player_tag: m.tag,
      player_name: m.name,
      trophies: m.trophies,
      donations: m.donations,
    }))

    const { error } = await supabase.from('member_snapshots').insert(rows)
    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ saved: rows.length })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}

// Allow cron to call via GET
export async function GET() {
  return POST()
}
