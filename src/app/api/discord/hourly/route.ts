import { getCurrentRiverRace, getClanMembers } from "@/lib/cr-api";
import { notifyHourlyWarCheck } from "@/lib/discord-notify";

export async function GET() { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    const [race, clanData] = await Promise.all([
      getCurrentRiverRace(),
      getClanMembers(),
    ]);

    const state: string = race?.state ?? "";
    if (state !== "warDay") {
      return Response.json({ skipped: true, reason: "Not war day" });
    }

    const activeTags = new Set<string>(
      (clanData?.items ?? []).map((m: { tag: string }) => m.tag)
    );

    const participants: Array<{
      tag: string; name: string; decksUsedToday: number;
    }> = race?.clan?.participants ?? [];

    const active = participants.filter(p => activeTags.has(p.tag));
    const allDone = active.every(p => p.decksUsedToday >= 4);

    if (allDone) {
      return Response.json({ skipped: true, reason: "Everyone is done" });
    }

    await notifyHourlyWarCheck(active);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
