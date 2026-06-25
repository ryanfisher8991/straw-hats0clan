import { getClanMembers } from "@/lib/cr-api";
import { notifyDonationLeaderboard } from "@/lib/discord-notify";

export async function GET() { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    const res = await getClanMembers();
    const members: Array<{ tag: string; name: string; donations: number; donationsReceived: number }> =
      res?.items ?? [];

    if (!members.length) {
      return Response.json({ error: "No members from CR API" }, { status: 500 });
    }

    await notifyDonationLeaderboard(members);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
