import { supabase } from "@/lib/supabase";
import { notifyBountyBoard } from "@/lib/discord-notify";

export async function GET() { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    // Find the highest single-war fame performance ever recorded
    const { data: topRow } = await supabase
      .from("war_member_stats")
      .select("player_name, player_tag, fame, snapshot_id")
      .order("fame", { ascending: false })
      .limit(5);

    if (!topRow?.length) {
      return Response.json({ skipped: true, reason: "No war stats yet" });
    }

    // Get snapshot info for the top performer's war
    const top = topRow[0];
    const { data: snap } = await supabase
      .from("war_snapshots")
      .select("season_id, section_index")
      .eq("id", top.snapshot_id)
      .maybeSingle();

    const top5 = topRow.map(r => ({
      name: r.player_name,
      tag: r.player_tag,
      fame: r.fame,
    }));

    await notifyBountyBoard(top5, snap ? `Season ${snap.season_id} Week ${snap.section_index + 1}` : "");
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
