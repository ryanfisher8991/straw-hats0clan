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

    // Load configurable threshold (default 1700)
    const { data: configRow } = await supabase
      .from("discord_config")
      .select("value")
      .eq("key", "kick_avg_threshold")
      .maybeSingle();
    const threshold = parseInt(configRow?.value ?? "1700", 10);

    // Get last 5 war snapshots for a meaningful average
    const { data: snapshots } = await supabase
      .from("war_snapshots")
      .select("id")
      .order("snapshotted_at", { ascending: false })
      .limit(5);

    if (!snapshots?.length) {
      return Response.json({ skipped: true, reason: "No war snapshots" });
    }

    const { data: stats } = await supabase
      .from("war_member_stats")
      .select("player_tag, player_name, fame, snapshot_id")
      .in("snapshot_id", snapshots.map(s => s.id));

    // Build per-member fame history
    const memberWars = new Map<string, { name: string; fames: number[] }>();
    for (const stat of stats ?? []) {
      if (!activeTags.has(stat.player_tag)) continue;
      if (!memberWars.has(stat.player_tag)) {
        memberWars.set(stat.player_tag, { name: stat.player_name, fames: [] });
      }
      memberWars.get(stat.player_tag)!.fames.push(stat.fame);
    }

    // Flag members with average fame below threshold (minimum 2 wars of data)
    const kickCandidates = [...memberWars.entries()]
      .filter(([, v]) => v.fames.length >= 2)
      .map(([tag, v]) => ({
        tag,
        name: v.name,
        avgFame: Math.round(v.fames.reduce((s, f) => s + f, 0) / v.fames.length),
        warsChecked: v.fames.length,
      }))
      .filter(m => m.avgFame < threshold)
      .sort((a, b) => a.avgFame - b.avgFame);

    if (kickCandidates.length === 0) {
      return Response.json({ skipped: true, reason: `No members below ${threshold} avg fame` });
    }

    await notifyKickRecommendation(kickCandidates, threshold);
    return Response.json({ ok: true, count: kickCandidates.length, threshold });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
