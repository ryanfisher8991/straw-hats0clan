import { supabase } from "@/lib/supabase";

const GUILD_ID  = process.env.DISCORD_GUILD_ID!;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;

// Must match exactly what's created in Discord. "Leader" is intentionally
// NOT bot-managed — the bot's own role sits below Leader in the hierarchy
// and can't assign/strip it, and leadership rarely changes anyway. It's
// treated as a protected, manually-managed role (see isProtectedRole below).
export const CLAN_ROLE_MAP: Record<string, string> = {
  leader:    "Leader",
  coLeader:  "Co-Leader",
  elder:     "Elder",
  member:    "Crew Member",
};

// Matches the site's War Rank Tiers (same thresholds used for promotion
// notifications in discord-notify.ts)
export const FAME_TIERS = [
  { name: "Clash Master",  min: 1000000 },
  { name: "Yonko",         min:  496100 },
  { name: "Kage",          min:  244400 },
  { name: "Super Saiyan",  min:  120400 },
  { name: "Hashira",       min:   59300 },
  { name: "Special Grade", min:   29200 },
  { name: "Diamond",       min:   14400 },
  { name: "Gold",          min:    7100 },
  { name: "Silver",        min:    3500 },
  { name: "Copper",        min:       0 },
];

export const OUT_OF_CLAN_ROLE_NAME = "Out of Clan";

// "Leader" deliberately excluded — see CLAN_ROLE_MAP comment above
export const ALL_MANAGED_ROLE_NAMES = [
  "Co-Leader", "Elder", "Crew Member",
  "Clash Master", "Yonko", "Kage", "Super Saiyan",
  "Hashira", "Special Grade", "Diamond", "Gold", "Silver", "Copper",
  "Unverified", "Verified", OUT_OF_CLAN_ROLE_NAME,
];

// Roles the mass-migration/resync tooling must never strip
export function isProtectedRole(role: { name: string; managed: boolean }): boolean {
  return role.managed || role.name === "Admin" || role.name === "Leader";
}

export async function discordApi(path: string, options: RequestInit = {}) {
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

export interface GuildRole { id: string; name: string; managed: boolean }

// Returns all roles in the guild (full objects, for protected-role checks)
export async function getGuildRoles(): Promise<GuildRole[]> {
  const roles = await discordApi(`/guilds/${GUILD_ID}/roles`);
  return roles ?? [];
}

// Returns a name → id map for all roles in the guild
async function getGuildRoleMap(): Promise<Record<string, string>> {
  const roles = await getGuildRoles();
  const map: Record<string, string> = {};
  for (const r of roles) map[r.name] = r.id;
  return map;
}

// Fetches every member in the guild (paginated)
export async function getAllGuildMembers(): Promise<Array<{
  user: { id: string; username: string; bot?: boolean };
  roles: string[];
  nick?: string | null;
}>> {
  const members: Array<{ user: { id: string; username: string; bot?: boolean }; roles: string[]; nick?: string | null }> = [];
  let after = "0";
  for (;;) {
    const batch = await discordApi(`/guilds/${GUILD_ID}/members?limit=1000&after=${after}`);
    if (!Array.isArray(batch)) {
      throw new Error(`Discord API error fetching guild members: ${JSON.stringify(batch)}`);
    }
    if (batch.length === 0) break;
    members.push(...batch);
    if (batch.length < 1000) break;
    after = batch[batch.length - 1].user.id;
  }
  return members;
}

// Strips every role from a member except ones whose id is in keepRoleIds
export async function stripAllRolesExceptProtected(
  discordUserId: string,
  currentRoleIds: string[],
  keepRoleIds: Set<string>,
): Promise<void> {
  const newRoles = currentRoleIds.filter(id => keepRoleIds.has(id));
  await discordApi(`/guilds/${GUILD_ID}/members/${discordUserId}`, {
    method: "PATCH",
    body: JSON.stringify({ roles: newRoles }),
  });
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

// Sync a single member's Discord roles based on their CR clan role + fame.
// inClan=false means they're a registered member who's no longer in the clan
// roster — they get Out of Clan only; rejoining (inClan=true again) naturally
// restores their rank/fame/Verified roles on the next sync.
export async function syncMemberRoles(
  discordUserId: string,
  clanRole: string,
  totalFame: number,
  inClan: boolean = true,
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

  const newRoles = [...keepRoles];

  if (!inClan) {
    const outOfClanId = guildRoles[OUT_OF_CLAN_ROLE_NAME];
    if (outOfClanId) newRoles.push(outOfClanId);
  } else {
    // Target clan role — only assign it if it's actually bot-managed (Leader
    // is deliberately excluded; leave whatever the member already has as-is)
    const clanRoleName = CLAN_ROLE_MAP[clanRole] ?? "Crew Member";
    const clanRoleId   = ALL_MANAGED_ROLE_NAMES.includes(clanRoleName) ? guildRoles[clanRoleName] : null;

    // Target fame tier
    const fameTier   = FAME_TIERS.find(t => totalFame >= t.min);
    const fameRoleId = fameTier ? guildRoles[fameTier.name] : null;

    // Registering always grants Verified (and implicitly drops Unverified,
    // since it's managed but never re-added below)
    const verifiedRoleId = guildRoles["Verified"];

    if (clanRoleId)     newRoles.push(clanRoleId);
    if (fameRoleId)      newRoles.push(fameRoleId);
    if (verifiedRoleId)  newRoles.push(verifiedRoleId);
  }

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
