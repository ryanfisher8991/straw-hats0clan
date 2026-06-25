import { getCurrentRiverRace, getClanMembers } from "@/lib/cr-api";
import { notifyPreWarChecklist } from "@/lib/discord-notify";

export async function GET() { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    const race = await getCurrentRiverRace();
    const state: string = race?.state ?? "";

    if (state !== "training") {
      return Response.json({ skipped: true, reason: `State is "${state}", not training` });
    }

    // Check if training ends within the next 4 hours
    const periodEnd = race?.periodEndTime as string | undefined;
    if (!periodEnd) {
      return Response.json({ skipped: true, reason: "No period end time" });
    }

    const endMs = new Date(periodEnd).getTime();
    const hoursLeft = (endMs - Date.now()) / (1000 * 60 * 60);

    if (hoursLeft > 4 || hoursLeft < 0) {
      return Response.json({ skipped: true, reason: `${hoursLeft.toFixed(1)}h left — outside alert window` });
    }

    const clanData = await getClanMembers();
    const memberCount = clanData?.items?.length ?? 0;

    await notifyPreWarChecklist(Math.round(hoursLeft), memberCount);
    return Response.json({ ok: true, hoursLeft });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
