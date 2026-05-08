import { getCurrentRiverRace, getRiverRaceLog } from '@/lib/cr-api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'current'

  try {
    const data = type === 'log' ? await getRiverRaceLog() : await getCurrentRiverRace()
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: 'Failed to fetch war data' }, { status: 500 })
  }
}
