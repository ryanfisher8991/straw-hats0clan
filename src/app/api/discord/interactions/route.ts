/**
 * Discord Interactions endpoint — handles slash commands.
 *
 * Register commands once with: node scripts/register-discord-commands.mjs
 * Then set "Interactions Endpoint URL" in Discord Developer Portal to:
 *   https://<your-vercel-domain>/api/discord/interactions
 */

import { after } from "next/server";
import { getCurrentRiverRace, getClanMembers } from "@/lib/cr-api";
import { isWarDay } from "@/lib/cr-utils";
import { supabase } from "@/lib/supabase";
import {
  syncMemberRoles, CLAN_ROLE_MAP, FAME_TIERS, ALL_MANAGED_ROLE_NAMES, OUT_OF_CLAN_ROLE_NAME,
  discordApi, getGuildRoles, getAllGuildMembers, stripAllRolesExceptProtected, isProtectedRole,
} from "@/lib/discord-roles";

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;
const GUILD_ID   = process.env.DISCORD_GUILD_ID!;
const APP_ID     = process.env.DISCORD_APPLICATION_ID!;

// Discord interaction types
const PING = 1;
const APPLICATION_COMMAND = 2;

// Discord interaction response types
const PONG = 1;
const CHANNEL_MESSAGE_WITH_SOURCE = 4;
const DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-signature-ed25519") ?? "";
  const timestamp = req.headers.get("x-signature-timestamp") ?? "";

  // Verify Discord signature
  const valid = await verifyDiscordSignature(PUBLIC_KEY, signature, timestamp, body);
  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const interaction = JSON.parse(body);

  // Respond to Discord's ping verification
  if (interaction.type === PING) {
    return Response.json({ type: PONG });
  }

  if (interaction.type === APPLICATION_COMMAND) {
    const command = interaction.data?.name;
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const secret = process.env.CRON_SECRET ?? "";
    const headers = { Authorization: `Bearer ${secret}` };

    // Unverified members can only /register (and check /setup) — everything
    // else gets redirected instead of run. Discord's own per-command
    // permission system can't target a custom role like this, so it's
    // enforced here instead.
    const ALLOWED_WHILE_UNVERIFIED = new Set(["register", "setup"]);
    if (command && !ALLOWED_WHILE_UNVERIFIED.has(command)) {
      const memberRoles: string[] = (interaction.member as { roles?: string[] } | undefined)?.roles ?? [];
      if (memberRoles.length > 0) {
        const guildRoles = await getGuildRoles();
        const unverifiedId = guildRoles.find(r => r.name === "Unverified")?.id;
        if (unverifiedId && memberRoles.includes(unverifiedId)) {
          return discordReply("🔒 You need to verify first — run `/register <your player tag>` to unlock the rest of the crew.");
        }
      }
    }

    if (command === "warcheck")  return handleWarCheck();
    if (command === "warremind") return handleWarRemind();
    if (command === "setup")     return handleSetup();
    if (command === "register")  return handleRegister(interaction);
    if (command === "whois")     return handleWhois(interaction);
    if (command === "admin-preview-resync") return handleAdminPreviewResync(interaction);
    if (command === "admin-apply-resync")   return handleAdminApplyResync(interaction);

    // Proxy commands to their feature API routes
    const PROXY: Record<string, string> = {
      warday:    "/api/discord/kickoff",
      scout:     "/api/discord/scout",
      donations: "/api/discord/donations",
      inactive:  "/api/discord/inactive",
      streaks:   "/api/discord/streaks",
      bounty:    "/api/discord/bounty",
      quote:     "/api/discord/quote",
    };

    if (command && PROXY[command]) {
      try {
        const res = await fetch(`${origin}${PROXY[command]}`, { method: "POST", headers });
        const data = await res.json();
        if (data.skipped) return discordReply(`ℹ️ ${data.reason}`);
        if (data.error) return discordReply(`❌ **/${command}** failed: ${data.error}`);
        return discordReply(`✅ **/${command}** posted to its channel!`);
      } catch (err) {
        return discordReply(`❌ **/${command}** failed: ${String(err)}`);
      }
    }
  }

  return Response.json({ type: CHANNEL_MESSAGE_WITH_SOURCE, data: { content: "Unknown command." } });
}

// ── /warcheck — show who needs to battle ──────────────────────────────────────

async function handleWarCheck() {
  // Defer immediately (CR API can be slow)
  // The real work is done in a follow-up — but since we're serverless we
  // respond synchronously within the 3s window by keeping it fast.
  try {
    const [race, clanData] = await Promise.all([
      getCurrentRiverRace(),
      getClanMembers(),
    ]);

    const state: string = race?.state ?? "";
    if (!isWarDay(state)) {
      return discordReply(
        `⚔️ No active war day right now. Current state: **${state || "unknown"}**`
      );
    }

    const activeTags = new Set<string>(
      (clanData?.items ?? []).map((m: { tag: string }) => m.tag)
    );
    const participants: Array<{
      tag: string; name: string; decksUsedToday: number; fame: number;
    }> = race?.clan?.participants ?? [];

    const needBattle = participants
      .filter((p) => activeTags.has(p.tag) && p.decksUsedToday < 4)
      .sort((a, b) => a.decksUsedToday - b.decksUsedToday);

    const done = participants.filter(
      (p) => activeTags.has(p.tag) && p.decksUsedToday >= 4
    );

    if (needBattle.length === 0) {
      return discordReply(`✅ All **${done.length}** members have finished their war battles today!`);
    }

    const lines = needBattle.map((p) => {
      const left = 4 - p.decksUsedToday;
      return `${"🟩".repeat(p.decksUsedToday)}${"⬛".repeat(left)} **${p.name}** — ${left} battle${left === 1 ? "" : "s"} left`;
    });

    const totalLeft = needBattle.reduce((s, p) => s + (4 - p.decksUsedToday), 0);
    const header = `⚔️ **War Check** — ${needBattle.length} member${needBattle.length === 1 ? "" : "s"} need${needBattle.length === 1 ? "s" : ""} to battle (${totalLeft} battles remaining)\n`;

    return discordReply(
      header + lines.join("\n") + `\n\n✅ ${done.length} members done.`
    );
  } catch (err) {
    return discordReply(`❌ Failed to fetch war data: ${String(err)}`);
  }
}

// ── /warremind — trigger the webhook reminder manually ────────────────────────

async function handleWarRemind() {
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://straw-hats-clan.vercel.app";
    const secret = process.env.CRON_SECRET ?? "";
    const res = await fetch(`${origin}/api/discord/remind`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json();

    if (data.skipped) return discordReply(`ℹ️ Reminder skipped: ${data.reason}`);
    if (data.error)   return discordReply(`❌ Reminder failed: ${data.error}`);
    if (data.allDone) return discordReply("✅ Everyone has finished their battles — sent a completion message!");
    return discordReply(
      `📣 Reminder sent! **${data.needBattle}** member${data.needBattle === 1 ? "" : "s"} still need to battle (${data.totalBattlesLeft} battles left).`
    );
  } catch (err) {
    return discordReply(`❌ Failed to send reminder: ${String(err)}`);
  }
}

// ── /register ─────────────────────────────────────────────────────────────────

async function handleRegister(interaction: Record<string, unknown>) {
  const member = interaction.member as { user: { id: string; username: string } } | undefined;
  const discordUserId  = member?.user?.id;
  const discordUsername = member?.user?.username ?? "Unknown";

  if (!discordUserId) return discordReply("❌ Could not read your Discord user ID.");

  const options = (interaction.data as { options?: Array<{ name: string; value: string }> })?.options ?? [];
  const rawTag  = options.find(o => o.name === "tag")?.value ?? "";
  const tag     = "#" + rawTag.trim().replace(/^#/, "").toUpperCase();

  if (!rawTag) return discordReply("❌ Please provide your player tag. Example: `/register #ABC123`");

  // Verify tag is in the clan
  const clanData = await getClanMembers();
  const clanMember = (clanData?.items ?? []).find(
    (m: { tag: string }) => m.tag.toUpperCase() === tag.toUpperCase()
  );

  if (!clanMember) {
    return discordReply(
      `❌ **${tag}** is not in the Straw Hats clan. Double-check your tag and try again.`
    );
  }

  // Check if this tag is already claimed by a different Discord user
  const { data: existing } = await supabase
    .from("discord_members")
    .select("discord_user_id, discord_username")
    .eq("player_tag", clanMember.tag)
    .maybeSingle();

  if (existing && existing.discord_user_id !== discordUserId) {
    return discordReply(
      `❌ **${clanMember.name}** is already registered to another Discord account. Ask an admin to sort it out.`
    );
  }

  // Save / update the registration
  const { error } = await supabase.from("discord_members").upsert({
    discord_user_id:  discordUserId,
    discord_username: discordUsername,
    player_tag:       clanMember.tag,
    player_name:      clanMember.name,
    clan_role:        clanMember.role ?? "member",
    updated_at:       new Date().toISOString(),
  }, { onConflict: "discord_user_id" });

  if (error) return discordReply(`❌ Failed to save registration: ${error.message}`);

  // Assign roles immediately
  const { data: fameRows } = await supabase
    .from("war_member_stats")
    .select("fame")
    .eq("player_tag", clanMember.tag);
  const { data: baselineRow } = await supabase
    .from("fame_baseline")
    .select("baseline_fame")
    .eq("player_tag", clanMember.tag)
    .maybeSingle();

  const totalFame =
    ((baselineRow as { baseline_fame?: number } | null)?.baseline_fame ?? 0) +
    (fameRows ?? []).reduce((s: number, r: { fame: number }) => s + r.fame, 0);

  const syncResult = await syncMemberRoles(discordUserId, clanMember.role ?? "member", totalFame);

  // Best-effort nickname sync — Discord refuses to rename the server owner,
  // so a failure here must not fail the whole registration.
  try {
    await discordApi(`/guilds/${GUILD_ID}/members/${discordUserId}`, {
      method: "PATCH",
      body: JSON.stringify({ nick: clanMember.name.slice(0, 32) }),
    });
  } catch (err) {
    console.warn(`Nickname update failed for ${discordUserId}:`, err);
  }

  const fameTier = FAME_TIERS.find(t => totalFame >= t.min);
  const clanRoleName = CLAN_ROLE_MAP[clanMember.role ?? "member"] ?? "Crew Member";

  if (!syncResult.ok) {
    return discordReply(
      `✅ **${clanMember.name}** registered! But role assignment failed: ${syncResult.reason ?? "unknown error"}. Make sure the bot has Manage Roles permission and is above the clan roles in the hierarchy.`
    );
  }

  return discordReply([
    `🏴‍☠️ **${clanMember.name}** has joined the crew manifest!`,
    ``,
    `**Clan Rank:** ${clanRoleName}`,
    `**Fame Tier:** ${fameTier ? fameTier.name : "Unranked"} (${totalFame.toLocaleString()} lifetime fame)`,
    ``,
    `Your Discord roles have been updated. Roles sync automatically after every war.`,
  ].join("\n"));
}

// ── /whois ─────────────────────────────────────────────────────────────────────

async function handleWhois(interaction: Record<string, unknown>) {
  const options = (interaction.data as { options?: Array<{ name: string; value: string }> })?.options ?? [];
  const targetId = options.find(o => o.name === "user")?.value;

  const { data } = await supabase
    .from("discord_members")
    .select("player_name, player_tag, clan_role, discord_username")
    .eq("discord_user_id", targetId ?? "")
    .maybeSingle();

  if (!data) return discordReply("❓ That user hasn't registered with `/register` yet.");

  const d = data as { player_name: string; player_tag: string; clan_role: string; discord_username: string };
  const clanRoleName = CLAN_ROLE_MAP[d.clan_role] ?? "Crew Member";
  return discordReply(`🏴‍☠️ **${d.discord_username}** is **${d.player_name}** (${d.player_tag}) — ${clanRoleName}`);
}

// ── Shared resync planning ──────────────────────────────────────────────────────

interface ResyncPlan {
  toSync: Array<{ id: string; label: string }>;
  toOutOfClan: Array<{ id: string; label: string }>;
  toUnverify: Array<{ id: string; label: string }>;
  alreadyClean: number;
}

async function planResync(): Promise<ResyncPlan> {
  const [members, guildRoles, registeredRes, clanData] = await Promise.all([
    getAllGuildMembers(),
    getGuildRoles(),
    supabase.from("discord_members").select("discord_user_id, player_tag"),
    getClanMembers(),
  ]);

  const inClanTags = new Set<string>((clanData?.items ?? []).map((m: { tag: string }) => m.tag));
  const registeredByDiscordId = new Map(
    (registeredRes.data ?? []).map((r: { discord_user_id: string; player_tag: string }) => [r.discord_user_id, r.player_tag])
  );
  const protectedIds = new Set(guildRoles.filter(isProtectedRole).map(r => r.id));
  const unverifiedId = guildRoles.find(r => r.name === "Unverified")?.id;

  const plan: ResyncPlan = { toSync: [], toOutOfClan: [], toUnverify: [], alreadyClean: 0 };

  for (const member of members) {
    if (member.user.bot) continue;
    const label = member.nick || member.user.username;

    const playerTag = registeredByDiscordId.get(member.user.id);
    if (playerTag) {
      if (inClanTags.has(playerTag)) {
        plan.toSync.push({ id: member.user.id, label });
      } else {
        plan.toOutOfClan.push({ id: member.user.id, label });
      }
      continue;
    }

    // Roles that aren't protected and aren't the Unverified gate role itself —
    // if any exist, this member needs to be stripped down to Unverified.
    const hasExtraRoles = member.roles.some(id => !protectedIds.has(id) && id !== unverifiedId);
    const alreadyUnverified = unverifiedId ? member.roles.includes(unverifiedId) : false;

    if (hasExtraRoles || !alreadyUnverified) {
      plan.toUnverify.push({ id: member.user.id, label });
    } else {
      plan.alreadyClean++;
    }
  }

  return plan;
}

function hasManageRoles(interaction: Record<string, unknown>): boolean {
  const member = interaction.member as { permissions?: string } | undefined;
  const perms = BigInt(member?.permissions ?? "0");
  const ADMINISTRATOR = BigInt(1) << BigInt(3);
  const MANAGE_ROLES  = BigInt(1) << BigInt(28);
  return (perms & ADMINISTRATOR) !== BigInt(0) || (perms & MANAGE_ROLES) !== BigInt(0);
}

// ── /admin-preview-resync ────────────────────────────────────────────────────────

async function handleAdminPreviewResync(interaction: Record<string, unknown>) {
  if (!hasManageRoles(interaction)) {
    return discordReply("❌ You need Manage Roles permission to run this.");
  }
  try {
    const plan = await planResync();
    const sample = (arr: ResyncPlan["toSync"]) => arr.slice(0, 15).map(m => m.label).join(", ") || "none";

    return discordReply([
      `🔍 **Resync Preview** — nothing has been changed yet.`,
      ``,
      `**${plan.toSync.length}** registered + in-clan members will be re-synced to their rank/fame roles + Verified:`,
      sample(plan.toSync),
      ``,
      `**${plan.toOutOfClan.length}** registered members who've left the clan will be set to Out of Clan:`,
      sample(plan.toOutOfClan),
      ``,
      `**${plan.toUnverify.length}** unregistered members will be stripped and set to Unverified:`,
      sample(plan.toUnverify),
      ``,
      `**${plan.alreadyClean}** members already clean (Unverified, nothing else to do).`,
      ``,
      `Run \`/admin-apply-resync\` to apply this.`,
    ].join("\n"));
  } catch (err) {
    return discordReply(`❌ Preview failed: ${String(err)}`);
  }
}

// ── /admin-apply-resync ──────────────────────────────────────────────────────────

function handleAdminApplyResync(interaction: Record<string, unknown>) {
  if (!hasManageRoles(interaction)) {
    return discordReply("❌ You need Manage Roles permission to run this.");
  }

  const token = interaction.token as string;

  after(async () => {
    try {
      const plan = await planResync();
      const guildRoles = await getGuildRoles();
      const roleByName = new Map(guildRoles.map(r => [r.name, r.id]));
      const protectedIds = new Set(guildRoles.filter(isProtectedRole).map(r => r.id));
      const unverifiedId = roleByName.get("Unverified");

      let synced = 0;
      let outOfClan = 0;
      let unverified = 0;

      // Registered + in-clan members → strip to protected-only, then run the normal sync
      for (const m of plan.toSync) {
        const member = await discordApi(`/guilds/${GUILD_ID}/members/${m.id}`);
        if (member?.roles) {
          await stripAllRolesExceptProtected(m.id, member.roles, protectedIds);
        }
        const { data: row } = await supabase
          .from("discord_members")
          .select("player_tag, clan_role")
          .eq("discord_user_id", m.id)
          .maybeSingle();
        if (row) {
          const [baselineRes, statsRes] = await Promise.all([
            supabase.from("fame_baseline").select("baseline_fame").eq("player_tag", row.player_tag).maybeSingle(),
            supabase.from("war_member_stats").select("fame").eq("player_tag", row.player_tag),
          ]);
          const totalFame =
            ((baselineRes.data as { baseline_fame?: number } | null)?.baseline_fame ?? 0) +
            (statsRes.data ?? []).reduce((s: number, r: { fame: number }) => s + r.fame, 0);
          const result = await syncMemberRoles(m.id, row.clan_role ?? "member", totalFame, true);
          if (result.ok) synced++;
        }
        await new Promise(r => setTimeout(r, 300));
      }

      // Registered but no longer in the clan → strip to protected-only, assign Out of Clan
      for (const m of plan.toOutOfClan) {
        const member = await discordApi(`/guilds/${GUILD_ID}/members/${m.id}`);
        if (member?.roles) {
          await stripAllRolesExceptProtected(m.id, member.roles, protectedIds);
        }
        const result = await syncMemberRoles(m.id, "member", 0, false);
        if (result.ok) outOfClan++;
        await new Promise(r => setTimeout(r, 300));
      }

      // Unregistered members → strip everything non-protected, assign Unverified
      for (const m of plan.toUnverify) {
        const member = await discordApi(`/guilds/${GUILD_ID}/members/${m.id}`);
        if (member?.roles) {
          const stripped = member.roles.filter((id: string) => protectedIds.has(id));
          const newRoles = unverifiedId ? [...stripped, unverifiedId] : stripped;
          await discordApi(`/guilds/${GUILD_ID}/members/${m.id}`, {
            method: "PATCH",
            body: JSON.stringify({ roles: newRoles }),
          });
          unverified++;
        }
        await new Promise(r => setTimeout(r, 300));
      }

      await discordApi(`/webhooks/${APP_ID}/${token}/messages/@original`, {
        method: "PATCH",
        body: JSON.stringify({
          content: `✅ **Resync complete** — ${synced} synced to their roles, ${outOfClan} set to Out of Clan, ${unverified} unregistered member(s) set to Unverified.`,
        }),
      });
    } catch (err) {
      await discordApi(`/webhooks/${APP_ID}/${token}/messages/@original`, {
        method: "PATCH",
        body: JSON.stringify({ content: `❌ Resync failed partway through: ${String(err)}` }),
      }).catch(() => {});
    }
  });

  return Response.json({ type: DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
}

// ── /setup ────────────────────────────────────────────────────────────────────

function handleSetup() {
  return discordReply([
    "🏴‍☠️ **Straw Hats Discord Bot — Setup Guide**",
    "",
    "Each feature posts to a channel you configure. Go to your clan website → **Discord Bot** page, expand any feature, and paste a webhook URL from that channel.",
    "",
    "**⚔️ War**",
    "`/warremind` • `/warcheck` • `/warday` • `/scout`",
    "Battle reminders, war kickoff, hourly progress, pre-war checklist, war results, perfect war alert, missed battles, opponent scouting",
    "",
    "**👥 Members**",
    "New member welcome, `/donations`, member count alert, `/inactive`, kick recommendations",
    "",
    "**🏆 Rankings**",
    "Rank promotions, `/streaks`, weekly fame leaderboard, `/bounty`, donation leaderboard",
    "",
    "**🎉 Fun**",
    "`/quote` — random One Piece quote posted to this channel",
    "",
    "**How to create a webhook:**",
    "Right-click a channel → Edit Channel → Integrations → Webhooks → New Webhook → Copy URL → paste into the website",
    "",
    "Set up at: your clan website → Discord Bot page (password protected)",
  ].join("\n"));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function discordReply(content: string) {
  return Response.json({
    type: CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content },
  });
}

async function verifyDiscordSignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToBytes(publicKey),
      { name: "Ed25519", namedCurve: "Ed25519" },
      false,
      ["verify"]
    );
    const encoder = new TextEncoder();
    return await crypto.subtle.verify(
      "Ed25519",
      key,
      hexToBytes(signature),
      encoder.encode(timestamp + body)
    );
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer as ArrayBuffer;
}
