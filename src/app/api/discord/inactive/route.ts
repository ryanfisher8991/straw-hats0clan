import { getClanMembers } from "@/lib/cr-api";
import { supabase } from "@/lib/supabase";
import { notifyInactiveMembers } from "@/lib/discord-notify";

export async function GET() { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    const res = await getClanMembers();
    const members: Array<{ tag: string; name: string; donations: number }> =
      res?.items ?? [];

    if (!members.length) {
      return Response.json({ error: "No members from CR API" }, { status: 500 });
    }

    // Load configurable threshold (default 850)
    const { data: configRow } = await supabase
      .from("discord_config")
      .select("value")
      .eq("key", "low_fame_threshold")
      .maybeSingle();
    const threshold = parseInt(configRow?.value ?? "850", 10);

    // Get the most recent war snapshot
    const { data: snapshots } = await supabase
      .from("war_snapshots")
      .select("id")
      .order("snapshotted_at", { ascending: false })
      .limit(1);

    const snapshotIds = (snapshots ?? []).map(s => s.id);
    const tags = members.map(m => m.tag);

    const fameByTag = new Map<string, number>();
    const decksUsedByTag = new Map<string, number>();
    if (snapshotIds.length > 0) {
      const { data: stats } = await supabase
        .from("war_member_stats")
        .select("player_tag, fame, decks_used")
        .in("snapshot_id", snapshotIds)
        .in("player_tag", tags);

      for (const row of stats ?? []) {
        fameByTag.set(row.player_tag, row.fame);
        decksUsedByTag.set(row.player_tag, row.decks_used);
      }
    }

    // 0 decks used means they weren't actually around to battle this week
    // (joined late, left early, or fully absent but still listed as a
    // participant) — don't flag them as inactive for it.
    const inactive = members.filter(m => {
      const fame = fameByTag.get(m.tag);
      if (fame === undefined || fame >= threshold) return false;
      if (decksUsedByTag.get(m.tag) === 0) return false;
      return true;
    });

    if (inactive.length === 0) {
      return Response.json({ skipped: true, reason: `No members below ${threshold} fame threshold` });
    }

    await notifyInactiveMembers(inactive.map(m => ({
      name: m.name,
      tag: m.tag,
      donations: m.donations,
      recentFame: fameByTag.get(m.tag) ?? 0,
    })), threshold);

    return Response.json({ ok: true, count: inactive.length, threshold });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
