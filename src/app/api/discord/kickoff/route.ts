import { getCurrentRiverRace, getClanMembers } from "@/lib/cr-api";
import { isWarDay } from "@/lib/cr-utils";
import { notifyWarKickoff } from "@/lib/discord-notify";

export async function GET() { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    const [race, clanData] = await Promise.all([
      getCurrentRiverRace(),
      getClanMembers(),
    ]);

    const state: string = race?.state ?? "";
    if (!isWarDay(state)) {
      return Response.json({ skipped: true, reason: `State is "${state}", not warDay` });
    }

    const activeTags = new Set<string>(
      (clanData?.items ?? []).map((m: { tag: string }) => m.tag)
    );

    const participants: Array<{ tag: string; name: string }> =
      race?.clan?.participants ?? [];

    const activeParticipants = participants.filter(p => activeTags.has(p.tag));
    const opponent = race?.standings?.find(
      (s: { clan: { tag: string } }) => s.clan?.tag !== "#QPRQ88YP"
    )?.clan;

    await notifyWarKickoff(activeParticipants.length, opponent?.name ?? "Unknown", opponent?.fame ?? 0);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
