import { supabase } from "@/lib/supabase";
import { getClanMembers } from "@/lib/cr-api";
import { notifyStreakMilestone } from "@/lib/discord-notify";

export async function GET() { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    const clanData = await getClanMembers();
    const activeTags = new Set<string>(
      (clanData?.items ?? []).map((m: { tag: string }) => m.tag)
    );

    // Get the last 20 war snapshots in order
    const { data: snapshots } = await supabase
      .from("war_snapshots")
      .select("id")
      .order("snapshotted_at", { ascending: false })
      .limit(20);

    if (!snapshots?.length) {
      return Response.json({ skipped: true, reason: "No war snapshots" });
    }

    const { data: stats } = await supabase
      .from("war_member_stats")
      .select("player_tag, player_name, decks_used, snapshot_id")
      .in("snapshot_id", snapshots.map(s => s.id));

    // Build per-member ordered war history
    const snapshotOrder = new Map(snapshots.map((s, i) => [s.id, i]));
    const memberWars = new Map<string, { name: string; wars: boolean[] }>();

    for (const stat of stats ?? []) {
      if (!activeTags.has(stat.player_tag)) continue;
      if (!memberWars.has(stat.player_tag)) {
        memberWars.set(stat.player_tag, { name: stat.player_name, wars: [] });
      }
      const entry = memberWars.get(stat.player_tag)!;
      const idx = snapshotOrder.get(stat.snapshot_id) ?? 0;
      entry.wars[idx] = stat.decks_used >= 4;
    }

    const milestones = [5, 10, 20];

    for (const [tag, { name, wars }] of memberWars) {
      // Count current streak from most recent war (index 0)
      let streak = 0;
      for (const fought of wars) {
        if (fought) streak++;
        else break;
      }

      // Check if this streak just hit a milestone
      for (const milestone of milestones) {
        if (streak === milestone) {
          await notifyStreakMilestone({ name, tag }, streak);
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
