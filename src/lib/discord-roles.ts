import { supabase } from "@/lib/supabase";

const GUILD_ID  = process.env.DISCORD_GUILD_ID!;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;

// One Piece themed role names — must match exactly what's created in Discord
export const CLAN_ROLE_MAP: Record<string, string> = {
  leader:    "Captain",
  coLeader:  "First Mate",
  elder:     "Elder",
  member:    "Crew Member",
};

export const FAME_TIERS = [
  { name: "Hashira",       min: 80000 },
  { name: "Special Grade", min: 40000 },
  { name: "Diamond",       min: 20000 },
  { name: "Gold",          min: 10000 },
  { name: "Silver",        min:  5000 },
  { name: "Copper",        min:  2000 },
];

const ALL_MANAGED_ROLE_NAMES = [
  "Captain", "First Mate", "Elder", "Crew Member",
  "Hashira", "Special Grade", "Diamond", "Gold", "Silver", "Copper",
];

async function discordApi(path: string, options: RequestInit = {}) {
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 204) return null;
  return res.json();
}

// Returns a name → id map for all roles in the guild
async function getGuildRoleMap(): Promise<Record<string, string>> {
  const roles = await discordApi(`/guilds/${GUILD_ID}/roles`);
  const map: Record<string, string> = {};
  for (const r of roles ?? []) map[r.name] = r.id;
  return map;
}

// Gets total fame for a player tag (baseline + all war stats)
async function getTotalFame(playerTag: string): Promise<number> {
  const [baselineRes, statsRes] = await Promise.all([
    supabase.from("fame_baseline").select("baseline_fame").eq("player_tag", playerTag).maybeSingle(),
    supabase.from("war_member_stats").select("fame").eq("player_tag", playerTag),
  ]);
  const baseline = (baselineRes.data as { baseline_fame: number } | null)?.baseline_fame ?? 0;
  const warFame  = (statsRes.data ?? []).reduce((s: number, r: { fame: number }) => s + r.fame, 0);
  return baseline + warFame;
}

// Sync a single member's Discord roles based on their CR clan role + fame
export async function syncMemberRoles(
  discordUserId: string,
  clanRole: string,
  totalFame: number,
): Promise<{ ok: boolean; reason?: string }> {
  const guildRoles = await getGuildRoleMap();
  const member     = await discordApi(`/guilds/${GUILD_ID}/members/${discordUserId}`);

  if (!member || member.code) {
    return { ok: false, reason: "User not found in Discord server" };
  }

  const currentRoleIds: string[] = member.roles ?? [];

  // Which managed role IDs they currently have
  const managedIds = new Set(
    ALL_MANAGED_ROLE_NAMES.map(n => guildRoles[n]).filter(Boolean)
  );

  // Non-managed roles stay untouched
  const keepRoles = currentRoleIds.filter(id => !managedIds.has(id));

  // Target clan role
  const clanRoleName = CLAN_ROLE_MAP[clanRole] ?? "Crew Member";
  const clanRoleId   = guildRoles[clanRoleName];

  // Target fame tier
  const fameTier   = FAME_TIERS.find(t => totalFame >= t.min);
  const fameRoleId = fameTier ? guildRoles[fameTier.name] : null;

  const newRoles = [...keepRoles];
  if (clanRoleId)  newRoles.push(clanRoleId);
  if (fameRoleId)  newRoles.push(fameRoleId);

  await discordApi(`/guilds/${GUILD_ID}/members/${discordUserId}`, {
    method: "PATCH",
    body: JSON.stringify({ roles: newRoles }),
  });

  return { ok: true };
}

// Sync all registered members — called after snapshots
export async function syncAllRoles() {
  const { data: registered } = await supabase
    .from("discord_members")
    .select("discord_user_id, player_tag");

  if (!registered?.length) return { synced: 0 };

  const guildRoles = await getGuildRoleMap();

  // Check which managed roles actually exist in the server
  const missingRoles = ALL_MANAGED_ROLE_NAMES.filter(n => !guildRoles[n]);
  if (missingRoles.length > 0) {
    console.warn("Missing Discord roles:", missingRoles);
  }

  let synced = 0;
  for (const row of registered) {
    try {
      const fame = await getTotalFame(row.player_tag);
      // Clan role comes from CR API — fetch in the sync-roles route instead
      // Here we just use stored clan role from discord_members
      const { data: member } = await supabase
        .from("discord_members")
        .select("clan_role")
        .eq("discord_user_id", row.discord_user_id)
        .maybeSingle();

      const result = await syncMemberRoles(
        row.discord_user_id,
        (member as { clan_role?: string } | null)?.clan_role ?? "member",
        fame,
      );
      if (result.ok) synced++;
      // Small delay to avoid Discord rate limits
      await new Promise(r => setTimeout(r, 250));
    } catch (err) {
      console.error(`Role sync failed for ${row.discord_user_id}:`, err);
    }
  }

  return { synced };
}
