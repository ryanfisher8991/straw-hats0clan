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

    // Get fame from the last 2 war snapshots
    const { data: snapshots } = await supabase
      .from("war_snapshots")
      .select("id")
      .order("snapshotted_at", { ascending: false })
      .limit(2);

    const snapshotIds = (snapshots ?? []).map(s => s.id);
    const tags = members.map(m => m.tag);

    const fameByTag = new Map<string, number>();
    if (snapshotIds.length > 0) {
      const { data: stats } = await supabase
        .from("war_member_stats")
        .select("player_tag, fame")
        .in("snapshot_id", snapshotIds)
        .in("player_tag", tags);

      for (const row of stats ?? []) {
        fameByTag.set(row.player_tag, (fameByTag.get(row.player_tag) ?? 0) + row.fame);
      }
    }

    const inactive = members.filter(m =>
      (fameByTag.get(m.tag) ?? 0) === 0 && m.donations < 10
    );

    if (inactive.length === 0) {
      return Response.json({ skipped: true, reason: "No inactive members" });
    }

    await notifyInactiveMembers(inactive.map(m => ({
      name: m.name,
      tag: m.tag,
      donations: m.donations,
      recentFame: fameByTag.get(m.tag) ?? 0,
    })));

    return Response.json({ ok: true, count: inactive.length });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
