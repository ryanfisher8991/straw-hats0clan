import { supabase } from "@/lib/supabase";
import { getAllGuildMembers, getGuildRoles, discordApi, ALL_MANAGED_ROLE_NAMES } from "@/lib/discord-roles";
import { notifyDiscordJoin } from "@/lib/discord-notify";

const GUILD_ID = process.env.DISCORD_GUILD_ID!;

// Polls the guild's member list (no gateway/websocket bot exists — this is a
// serverless-only app) and, for anyone we haven't seen before: assigns
// Unverified and posts a welcome message telling them to /register.
export async function GET()  { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    const [members, guildRoles, seenRes] = await Promise.all([
      getAllGuildMembers(),
      getGuildRoles(),
      supabase.from("discord_seen_members").select("discord_user_id"),
    ]);

    const unverifiedRoleId = guildRoles.find(r => r.name === "Unverified")?.id;
    if (!unverifiedRoleId) {
      return Response.json({ error: "Unverified role not found in guild" }, { status: 500 });
    }

    const seenIds = new Set((seenRes.data ?? []).map((r: { discord_user_id: string }) => r.discord_user_id));
    const managedIds = new Set(guildRoles.filter(r => ALL_MANAGED_ROLE_NAMES.includes(r.name)).map(r => r.id));

    let welcomed = 0;

    for (const member of members) {
      if (member.user.bot) continue;
      if (seenIds.has(member.user.id)) continue;

      await supabase.from("discord_seen_members").insert({ discord_user_id: member.user.id });

      // Only gate them if they don't already hold a managed role (avoids
      // re-flagging someone who was already verified before this feature shipped)
      const alreadyManaged = member.roles.some(id => managedIds.has(id));
      if (!alreadyManaged) {
        await discordApi(`/guilds/${GUILD_ID}/members/${member.user.id}`, {
          method: "PATCH",
          body: JSON.stringify({ roles: [...member.roles, unverifiedRoleId] }),
        });
        await notifyDiscordJoin(member.nick || member.user.username);
        welcomed++;
      }

      await new Promise(r => setTimeout(r, 300));
    }

    return Response.json({ ok: true, checked: members.length, welcomed });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
