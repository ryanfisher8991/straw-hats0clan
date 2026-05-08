import { getPlayer } from '@/lib/cr-api'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag')

  if (!tag) return Response.json({ error: 'Missing tag' }, { status: 400 })

  try {
    const [player, decksResult] = await Promise.all([
      getPlayer(tag),
      supabase.from('meta_decks').select('*').order('created_at', { ascending: false }),
    ])

    return Response.json({ player, metaDecks: decksResult.data ?? [] })
  } catch (err) {
    return Response.json({ error: 'Failed to fetch player data' }, { status: 500 })
  }
}
