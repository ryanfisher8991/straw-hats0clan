import { getCurrentRiverRace } from "@/lib/cr-api";
import { notifyOpponentScout } from "@/lib/discord-notify";

export async function GET() { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    const race = await getCurrentRiverRace();

    const opponent = race?.standings?.find(
      (s: { clan: { tag: string } }) => s.clan?.tag !== "#QPRQ88YP"
    )?.clan;

    if (!opponent) {
      return Response.json({ skipped: true, reason: "No opponent found" });
    }

    await notifyOpponentScout({
      name: opponent.name ?? "Unknown",
      tag: opponent.tag ?? "",
      fame: opponent.fame ?? 0,
      participants: (opponent.participants ?? []).length,
      clanScore: opponent.clanScore ?? 0,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
