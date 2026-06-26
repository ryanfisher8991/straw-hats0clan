/**
 * Discord Interactions endpoint — handles slash commands.
 *
 * Register commands once with: node scripts/register-discord-commands.mjs
 * Then set "Interactions Endpoint URL" in Discord Developer Portal to:
 *   https://<your-vercel-domain>/api/discord/interactions
 */

import { getCurrentRiverRace, getClanMembers } from "@/lib/cr-api";
import { isWarDay } from "@/lib/cr-utils";

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;

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

    if (command === "warcheck")  return handleWarCheck();
    if (command === "warremind") return handleWarRemind();
    if (command === "setup")     return handleSetup();

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
