import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('graveyard')
    .select('*')
    .order('kicked_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  const { player_tag, player_name, reason } = await request.json()

  if (!player_tag || !player_name) {
    return Response.json({ error: 'player_tag and player_name are required' }, { status: 400 })
  }

  const tag = player_tag.startsWith('#') ? player_tag : `#${player_tag}`

  const { data, error } = await supabase
    .from('graveyard')
    .upsert({ player_tag: tag, player_name, reason: reason || null }, { onConflict: 'player_tag' })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(request: Request) {
  const { id } = await request.json()

  const { error } = await supabase
    .from('graveyard')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
