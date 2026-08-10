import { supabase } from "@/lib/supabase";
import { getPlayer } from "@/lib/cr-api";

export async function GET() {
  const { data: prospects, error } = await supabase
    .from("recruit_prospects")
    .select("*")
    .order("added_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Pull live stats for each prospect — trophies/level/current clan can
  // change any time, so this is never cached/stored, always fetched fresh
  const enriched = await Promise.all(
    (prospects ?? []).map(async (p) => {
      try {
        const player = await getPlayer(p.player_tag);
        return {
          id: p.id,
          tag: p.player_tag,
          notes: p.notes,
          addedAt: p.added_at,
          name: player.name,
          trophies: player.trophies,
          bestTrophies: player.bestTrophies,
          expLevel: player.expLevel,
          clan: player.clan ? { tag: player.clan.tag, name: player.clan.name } : null,
          error: null,
        };
      } catch {
        return {
          id: p.id,
          tag: p.player_tag,
          notes: p.notes,
          addedAt: p.added_at,
          name: null,
          trophies: null,
          bestTrophies: null,
          expLevel: null,
          clan: null,
          error: "Player not found — tag may be invalid",
        };
      }
    })
  );

  enriched.sort((a, b) => (b.trophies ?? -1) - (a.trophies ?? -1));

  return Response.json({ prospects: enriched });
}

export async function POST(req: Request) {
  const { tag, notes } = await req.json();
  if (!tag) return Response.json({ error: "tag is required" }, { status: 400 });

  const playerTag = "#" + String(tag).trim().replace(/^#/, "").toUpperCase();

  // Validate the tag actually resolves to a real player before saving
  try {
    await getPlayer(playerTag);
  } catch {
    return Response.json({ error: `${playerTag} isn't a valid Clash Royale player tag` }, { status: 400 });
  }

  const { error } = await supabase.from("recruit_prospects").upsert(
    { player_tag: playerTag, notes: notes ?? null, added_at: new Date().toISOString() },
    { onConflict: "player_tag" }
  );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { tag } = await req.json();
  if (!tag) return Response.json({ error: "tag is required" }, { status: 400 });

  const playerTag = "#" + String(tag).trim().replace(/^#/, "").toUpperCase();
  const { error } = await supabase.from("recruit_prospects").delete().eq("player_tag", playerTag);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
