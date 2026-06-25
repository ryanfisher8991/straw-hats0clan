import { supabase } from "@/lib/supabase";

interface ChannelRow {
  feature: string;
  webhook_url: string;
  enabled: boolean;
}

async function getWebhook(feature: string): Promise<string | null> {
  const { data } = await supabase
    .from("discord_channels")
    .select("webhook_url, enabled")
    .eq("feature", feature)
    .maybeSingle();

  const row = data as ChannelRow | null;
  if (!row || !row.enabled || !row.webhook_url) return null;
  return row.webhook_url;
}

async function postEmbed(webhookUrl: string, payload: object): Promise<boolean> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

// ── War Results ───────────────────────────────────────────────────────────────

export async function notifyWarResults(participants: Array<{
  name: string; fame: number; decksUsed: number; tag: string;
}>, seasonId: number, sectionIndex: number) {
  const webhook = await getWebhook("war_results");
  if (!webhook) return;

  const sorted = [...participants].sort((a, b) => b.fame - a.fame);
  const top3 = sorted.slice(0, 3);
  const totalFame = participants.reduce((s, p) => s + p.fame, 0);
  const totalMissed = participants.reduce((s, p) => s + Math.max(0, 4 - p.decksUsed), 0);
  const medals = ["🥇", "🥈", "🥉"];

  const podium = top3.map((p, i) =>
    `${medals[i]} **${p.name}** — ${p.fame.toLocaleString()} fame`
  ).join("\n");

  await postEmbed(webhook, {
    embeds: [{
      title: `⚔️ War Results — Season ${seasonId} Week ${sectionIndex + 1}`,
      description: `The Grand Line war is over. Here are the top pirates who carried the crew:\n\n${podium}`,
      color: 0xF8D978,
      fields: [
        { name: "🏴‍☠️ Crew Fame", value: totalFame.toLocaleString(), inline: true },
        { name: "💀 Battles Missed", value: totalMissed === 0 ? "None — full crew fought! 🔥" : String(totalMissed), inline: true },
        { name: "👥 Pirates", value: String(participants.length), inline: true },
      ],
      footer: { text: "Straw Hats Clash Royale · I'm gonna be King of the Pirates!" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Perfect War ───────────────────────────────────────────────────────────────

export async function notifyPerfectWar(participants: Array<{
  name: string; decksUsed: number;
}>, totalFame: number) {
  const allPerfect = participants.every(p => p.decksUsed >= 4);
  if (!allPerfect) return;

  const webhook = await getWebhook("perfect_war");
  if (!webhook) return;

  await postEmbed(webhook, {
    embeds: [{
      title: "🔥 GOMU GOMU NO PERFECT WAR!!",
      description: `Every single Straw Hat used all 4 decks. Not a single pirate stood down.\n\nThis is the power of the crew that's going to make Luffy King of the Pirates! 🏴‍☠️\n\n**${participants.length}/${participants.length}** pirates fought · **${totalFame.toLocaleString()}** total fame`,
      color: 0xFF6B00,
      footer: { text: "Straw Hats Clash Royale · Nami, I want to live!" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Missed Battles ────────────────────────────────────────────────────────────

export async function notifyMissedBattles(participants: Array<{
  name: string; decksUsed: number;
}>) {
  const missed = participants.filter(p => p.decksUsed < 4);
  if (missed.length === 0) return;

  const webhook = await getWebhook("missed_battles");
  if (!webhook) return;

  const lines = missed
    .sort((a, b) => a.decksUsed - b.decksUsed)
    .map(p => {
      const m = 4 - p.decksUsed;
      return `💤 **${p.name}** — sat out ${m} battle${m === 1 ? "" : "s"}`;
    })
    .join("\n");

  await postEmbed(webhook, {
    embeds: [{
      title: "⚠️ Pirates Who Didn't Fight",
      description: `Even Usopp showed up to battle. These crew members didn't:\n\n${lines}\n\n*Zoro got lost again is not an excuse.*`,
      color: 0xF87171,
      footer: { text: "Straw Hats Clash Royale" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Rank Promotions ───────────────────────────────────────────────────────────

const WAR_RANKS = [
  { name: "Hashira",       min: 60000, emoji: "🟢", color: 0x39FF14,
    flavor: "You've reached the pinnacle. Zoro himself would acknowledge your strength." },
  { name: "Special Grade", min: 29200, emoji: "🟣", color: 0xA78BFA,
    flavor: "A power rivaling the Yonko. The Grand Line trembles at your name." },
  { name: "Diamond",       min: 14400, emoji: "💎", color: 0x22D3EE,
    flavor: "Your Haki is undeniable. The Marines have put a bounty on your head." },
  { name: "Gold",          min: 7100,  emoji: "🥇", color: 0xF8D978,
    flavor: "You fight like a true Straw Hat. Even Nami is impressed — and she never is." },
  { name: "Silver",        min: 3500,  emoji: "🥈", color: 0xCBD5E1,
    flavor: "Gaining strength on the Grand Line. Chopper says your Haki is developing nicely." },
  { name: "Copper",        min: 0,     emoji: "🥉", color: 0xB45309,
    flavor: "Every legend starts somewhere. Even Luffy started with nothing." },
];

function getRank(fame: number) {
  return WAR_RANKS.find(r => fame >= r.min) ?? WAR_RANKS[WAR_RANKS.length - 1];
}

export async function notifyPromotions(members: Array<{
  tag: string; name: string; fame: number;
}>) {
  const webhook = await getWebhook("promotions");
  if (!webhook) return;

  for (const member of members) {
    const rank = getRank(member.fame);

    const { data: existing } = await supabase
      .from("discord_promotions_sent")
      .select("player_tag")
      .eq("player_tag", member.tag)
      .eq("rank_name", rank.name)
      .maybeSingle();

    if (existing) continue;

    if (rank.name === "Copper") {
      await supabase.from("discord_promotions_sent").upsert(
        { player_tag: member.tag, rank_name: rank.name },
        { onConflict: "player_tag,rank_name" }
      );
      continue;
    }

    await postEmbed(webhook, {
      embeds: [{
        title: `${rank.emoji} Rank Up — ${rank.name}!`,
        description: `**${member.name}** has reached **${rank.name}** rank!\n\n*${rank.flavor}*\n\n${member.fame.toLocaleString()} lifetime fame`,
        color: rank.color,
        footer: { text: "Straw Hats Clash Royale · I'm gonna be King of the Pirates!" },
        timestamp: new Date().toISOString(),
      }],
    });

    await supabase.from("discord_promotions_sent").upsert(
      { player_tag: member.tag, rank_name: rank.name },
      { onConflict: "player_tag,rank_name" }
    );

    await new Promise(r => setTimeout(r, 500));
  }
}

// ── Welcome New Members ───────────────────────────────────────────────────────

const WELCOME_LINES = [
  "The Log Pose has pointed you here for a reason. Welcome aboard! 🧭",
  "Every great pirate crew starts with one person saying yes. That's you. 🏴‍☠️",
  "Luffy didn't ask questions when he recruited you. Neither do we. Set sail! ⛵",
  "Robin said she wants to live. We say we want to war. Welcome to the crew! 🌺",
  "Sanji's already cooking something to celebrate. Don't waste it. 🍖",
];

export async function notifyNewMembers(newMembers: Array<{ name: string; trophies: number }>, totalCount: number) {
  if (newMembers.length === 0) return;

  const webhook = await getWebhook("welcome");
  if (!webhook) return;

  for (const member of newMembers) {
    const flavor = WELCOME_LINES[Math.floor(Math.random() * WELCOME_LINES.length)];
    await postEmbed(webhook, {
      embeds: [{
        title: "🏴‍☠️ A New Pirate Joins the Crew!",
        description: `**${member.name}** has boarded the Thousand Sunny!\n\n*${flavor}*\n\nYou're now sailing with **${totalCount} pirates**. Your first war battle is your initiation — don't let the crew down.`,
        color: 0x34D399,
        fields: [
          { name: "🏆 Trophies", value: member.trophies.toLocaleString(), inline: true },
          { name: "🗺️ Clan Tag", value: "#QPRQ88YP", inline: true },
        ],
        footer: { text: "Straw Hats Clash Royale · The sea is ours!" },
        timestamp: new Date().toISOString(),
      }],
    });

    await new Promise(r => setTimeout(r, 500));
  }
}

// ── Weekly Leaderboard ────────────────────────────────────────────────────────

const LEADERBOARD_TAUNTS = [
  "Who's carrying the crew this week?",
  "Zoro would be disappointed in anyone not in the top 3.",
  "Luffy doesn't check leaderboards. The rest of us do.",
  "The Grand Line doesn't rank itself. We do it for you.",
];

export async function notifyLeaderboard(members: Array<{
  tag: string; name: string; fame: number;
}>) {
  const webhook = await getWebhook("leaderboard");
  if (!webhook) return;

  const top5 = [...members]
    .filter(m => m.fame > 0)
    .sort((a, b) => b.fame - a.fame)
    .slice(0, 5);

  if (top5.length === 0) return;

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
  const taunt = LEADERBOARD_TAUNTS[Math.floor(Math.random() * LEADERBOARD_TAUNTS.length)];

  const lines = top5.map((m, i) => {
    const rank = getRank(m.fame);
    return `${medals[i]} **${m.name}** — ${m.fame.toLocaleString()} fame · ${rank.emoji} ${rank.name}`;
  }).join("\n");

  await postEmbed(webhook, {
    embeds: [{
      title: "📊 Weekly Fame Leaderboard",
      description: `*${taunt}*\n\n${lines}`,
      color: 0xF8D978,
      footer: { text: "Straw Hats Clash Royale · Posted every Monday" },
      timestamp: new Date().toISOString(),
    }],
  });
}
