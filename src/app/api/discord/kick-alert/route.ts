import { supabase } from "@/lib/supabase";
import { getClanMembers } from "@/lib/cr-api";
import { notifyKickRecommendation } from "@/lib/discord-notify";

export async function GET() { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    const clanData = await getClanMembers();
    const activeTags = new Set<string>(
      (clanData?.items ?? []).map((m: { tag: string }) => m.tag)
    );

    // Get last 2 completed wars
    const { data: snapshots } = await supabase
      .from("war_snapshots")
      .select("id")
      .order("snapshotted_at", { ascending: false })
      .limit(2);

    if (!snapshots || snapshots.length < 2) {
      return Response.json({ skipped: true, reason: "Need at least 2 war snapshots" });
    }

    const { data: stats } = await supabase
      .from("war_member_stats")
      .select("player_tag, player_name, fame, decks_used, snapshot_id")
      .in("snapshot_id", snapshots.map(s => s.id));

    // Find members with 0 fame in BOTH last 2 wars
    const famePerWar = new Map<string, { name: string; wars: number[] }>();
    for (const stat of stats ?? []) {
      if (!activeTags.has(stat.player_tag)) continue;
      if (!famePerWar.has(stat.player_tag)) {
        famePerWar.set(stat.player_tag, { name: stat.player_name, wars: [] });
      }
      famePerWar.get(stat.player_tag)!.wars.push(stat.fame);
    }

    const kickCandidates = [...famePerWar.entries()]
      .filter(([, v]) => v.wars.length >= 2 && v.wars.every(f => f === 0))
      .map(([tag, v]) => ({ tag, name: v.name, consecutiveZeros: v.wars.length }));

    if (kickCandidates.length === 0) {
      return Response.json({ skipped: true, reason: "No kick candidates" });
    }

    await notifyKickRecommendation(kickCandidates);
    return Response.json({ ok: true, count: kickCandidates.length });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
