import { getClan, getClanMembers } from '@/lib/cr-api'

export async function GET() {
  try {
    const [clan, members] = await Promise.all([getClan(), getClanMembers()])
    return Response.json({ clan, members: members.items })
  } catch (err) {
    return Response.json({ error: 'Failed to fetch clan data' }, { status: 500 })
  }
}
