import { getClanMembers } from "@/lib/cr-api";
import { supabase } from "@/lib/supabase";
import { syncMemberRoles, FAME_TIERS, CLAN_ROLE_MAP } from "@/lib/discord-roles";

const GUILD_ID  = process.env.DISCORD_GUILD_ID!;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;

export async function GET() { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    // Get all registered discord members
    const { data: registered } = await supabase
      .from("discord_members")
      .select("discord_user_id, player_tag");

    if (!registered?.length) {
      return Response.json({ skipped: true, reason: "No registered members" });
    }

    // Get current clan roster from CR API (for clan roles)
    const clanData = await getClanMembers();
    const clanRoleByTag = new Map<string, string>();
    for (const m of clanData?.items ?? []) {
      clanRoleByTag.set(m.tag, m.role ?? "member");
    }

    // Get fame data for all registered players
    const tags = registered.map(r => r.player_tag);

    const [baselineRes, statsRes] = await Promise.all([
      supabase.from("fame_baseline").select("player_tag, baseline_fame").in("player_tag", tags),
      supabase.from("war_member_stats").select("player_tag, fame").in("player_tag", tags),
    ]);

    const fameMap = new Map<string, number>();
    for (const r of baselineRes.data ?? []) {
      fameMap.set(r.player_tag, (fameMap.get(r.player_tag) ?? 0) + r.baseline_fame);
    }
    for (const r of statsRes.data ?? []) {
      fameMap.set(r.player_tag, (fameMap.get(r.player_tag) ?? 0) + r.fame);
    }

    let synced = 0;
    let skipped = 0;
    const results: Array<{ discord_user_id: string; ok: boolean; reason?: string }> = [];

    for (const row of registered) {
      const clanRole = clanRoleByTag.get(row.player_tag) ?? "member";
      const totalFame = fameMap.get(row.player_tag) ?? 0;

      // Update stored clan_role in DB
      await supabase
        .from("discord_members")
        .update({ clan_role: clanRole, updated_at: new Date().toISOString() })
        .eq("discord_user_id", row.discord_user_id);

      const result = await syncMemberRoles(row.discord_user_id, clanRole, totalFame);
      results.push({ discord_user_id: row.discord_user_id, ...result });
      if (result.ok) synced++; else skipped++;

      // Respect Discord rate limits
      await new Promise(r => setTimeout(r, 250));
    }

    return Response.json({ ok: true, synced, skipped, results });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
