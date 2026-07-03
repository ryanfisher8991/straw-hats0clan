import { supabase } from "@/lib/supabase";

// Must match src/app/(protected)/members/page.tsx exactly — that page is
// the source of truth for what "lifetime fame" means for a member. Wars
// before this cutoff are already baked into fame_baseline; summing them
// again double-counts.
export const POST_BASELINE_CUTOFF = "2026-05-05T00:00:00Z";

function normName(n: string) {
  return n.toLowerCase().replace(/0/g, "o").replace(/[\s._-]/g, "");
}

// Bulk lifetime-fame lookup (baseline + post-cutoff war fame only), keyed by
// player tag. Baseline rows can have a null player_tag (spreadsheet-seeded,
// name-only), so this falls back through tag → exact name → normalized name,
// same as the Members page.
export async function getLifetimeFameMap(
  members: Array<{ tag: string; name: string }>
): Promise<Map<string, number>> {
  const { data: baselineRows } = await supabase
    .from("fame_baseline")
    .select("player_name, player_tag, baseline_fame");

  const baselineByName = new Map<string, number>();
  const baselineByNorm = new Map<string, number>();
  const baselineByTag = new Map<string, number>();
  for (const row of baselineRows ?? []) {
    baselineByName.set(row.player_name.toLowerCase(), row.baseline_fame);
    baselineByNorm.set(normName(row.player_name), row.baseline_fame);
    if (row.player_tag) baselineByTag.set(row.player_tag, row.baseline_fame);
  }

  const { data: recentSnapshots } = await supabase
    .from("war_snapshots")
    .select("id")
    .gte("snapshotted_at", POST_BASELINE_CUTOFF);

  const recentFameByTag = new Map<string, number>();
  if (recentSnapshots && recentSnapshots.length > 0) {
    const snapshotIds = recentSnapshots.map((s: { id: string }) => s.id);
    const { data: recentStats } = await supabase
      .from("war_member_stats")
      .select("player_tag, fame")
      .in("snapshot_id", snapshotIds);
    for (const row of recentStats ?? []) {
      recentFameByTag.set(row.player_tag, (recentFameByTag.get(row.player_tag) ?? 0) + row.fame);
    }
  }

  const result = new Map<string, number>();
  for (const m of members) {
    const base = baselineByTag.get(m.tag)
      ?? baselineByName.get(m.name.toLowerCase())
      ?? baselineByNorm.get(normName(m.name))
      ?? 0;
    const recent = recentFameByTag.get(m.tag) ?? 0;
    result.set(m.tag, base + recent);
  }
  return result;
}

export async function getLifetimeFame(tag: string, name: string): Promise<number> {
  const map = await getLifetimeFameMap([{ tag, name }]);
  return map.get(tag) ?? 0;
}
