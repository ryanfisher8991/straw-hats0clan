import { supabase } from "@/lib/supabase";
import { getClanMembers } from "@/lib/cr-api";
import { notifyBountyBoard } from "@/lib/discord-notify";

export async function GET() { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    const clanData = await getClanMembers();
    const activeTags = (clanData?.items ?? []).map((m: { tag: string }) => m.tag);
    if (!activeTags.length) {
      return Response.json({ skipped: true, reason: "No active clan members from CR API" });
    }

    // Find the highest single-war fame performances ever recorded — current
    // clan members only, so former members' old records don't show up
    const { data: topRows } = await supabase
      .from("war_member_stats")
      .select("player_name, player_tag, fame, snapshot_id")
      .in("player_tag", activeTags)
      .order("fame", { ascending: false })
      .limit(5);

    if (!topRows?.length) {
      return Response.json({ skipped: true, reason: "No war stats yet" });
    }

    // Each entry can be from a different week — fetch snapshot info per row
    const snapshotIds = [...new Set(topRows.map(r => r.snapshot_id))];
    const { data: snaps } = await supabase
      .from("war_snapshots")
      .select("id, season_id, section_index")
      .in("id", snapshotIds);

    const snapById = new Map((snaps ?? []).map(s => [s.id, s]));

    const top5 = topRows.map(r => {
      const snap = snapById.get(r.snapshot_id);
      return {
        name: r.player_name,
        tag: r.player_tag,
        fame: r.fame,
        warLabel: snap ? `Season ${snap.season_id} Week ${snap.section_index + 1}` : "",
      };
    });

    await notifyBountyBoard(top5);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
