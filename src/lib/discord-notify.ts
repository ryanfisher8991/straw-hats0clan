import { supabase } from "@/lib/supabase";

interface ChannelRow {
  feature: string;
  webhook_url: string;
  enabled: boolean;
}

export async function getWebhook(feature: string): Promise<string | null> {
  const { data } = await supabase
    .from("discord_channels")
    .select("webhook_url, enabled")
    .eq("feature", feature)
    .maybeSingle();

  const row = data as ChannelRow | null;
  if (!row || !row.enabled || !row.webhook_url) return null;
  return row.webhook_url;
}

export async function postEmbed(webhookUrl: string, payload: object): Promise<boolean> {
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
  const totalMissed = participants.reduce((s, p) => s + Math.max(0, 16 - p.decksUsed), 0);
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
  const allPerfect = participants.every(p => p.decksUsed >= 16);
  if (!allPerfect) return;

  const webhook = await getWebhook("perfect_war");
  if (!webhook) return;

  await postEmbed(webhook, {
    embeds: [{
      title: "🔥 GOMU GOMU NO PERFECT WAR!!",
      description: `Every single Straw Hat used all 16 decks. Not a single pirate stood down.\n\nThis is the power of the crew that's going to make Luffy King of the Pirates! 🏴‍☠️\n\n**${participants.length}/${participants.length}** pirates fought · **${totalFame.toLocaleString()}** total fame`,
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
  const missed = participants.filter(p => p.decksUsed < 16);
  if (missed.length === 0) return;

  const webhook = await getWebhook("missed_battles");
  if (!webhook) return;

  const lines = missed
    .sort((a, b) => a.decksUsed - b.decksUsed)
    .map(p => `💤 **${p.name}** — ${p.decksUsed}/16`)
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
  { name: "Clash Master",  min: 1000000, emoji: "👑", color: 0xFFFFFF,
    flavor: "There is no rank above this. You are the Clash Master." },
  { name: "Yonko",         min: 496100, emoji: "🌊", color: 0xEF4444,
    flavor: "One of the Four Emperors. The seas themselves answer to you now." },
  { name: "Kage",          min: 244400, emoji: "🍃", color: 0x374151,
    flavor: "A shadow that leads. Your will alone commands the crew." },
  { name: "Super Saiyan",  min: 120400, emoji: "⚡", color: 0xFDE047,
    flavor: "Power beyond limits. Your aura alone breaks the battlefield." },
  { name: "Hashira",       min: 59300, emoji: "🟢", color: 0x39FF14,
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

// ── War Day Kickoff ───────────────────────────────────────────────────────────

export async function notifyWarKickoff(memberCount: number, opponentName: string, opponentFame: number) {
  const webhook = await getWebhook("kickoff");
  if (!webhook) return;

  const KICKOFF_LINES = [
    "The Log Pose has locked on. There's no turning back now.",
    "Luffy's already fired up. Are you?",
    "The Grand Line doesn't give second chances. Make your battles count.",
    "Zoro found the arena. Somehow. Let's go.",
    "Nami checked the weather. Clear skies. Perfect for war.",
  ];
  const flavor = KICKOFF_LINES[Math.floor(Math.random() * KICKOFF_LINES.length)];

  await postEmbed(webhook, {
    embeds: [{
      title: "⚔️ War Day Has Started!",
      description: `*${flavor}*\n\nThe Straw Hats are ready to sail into battle. **${memberCount}** pirates are registered for this war.`,
      color: 0xFF6B00,
      fields: [
        { name: "🏴‍☠️ Enemy Crew", value: opponentName, inline: true },
        { name: "⚔️ Their Current Fame", value: opponentFame > 0 ? opponentFame.toLocaleString() : "Unknown", inline: true },
        { name: "🗡️ Decks Per Member", value: "4 battles available", inline: true },
      ],
      footer: { text: "Straw Hats Clash Royale · Use all 4 decks!" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Hourly War Check ──────────────────────────────────────────────────────────

export async function notifyHourlyWarCheck(participants: Array<{
  tag: string; name: string; decksUsedToday: number;
}>) {
  const webhook = await getWebhook("hourly");
  if (!webhook) return;

  const done = participants.filter(p => p.decksUsedToday >= 4);
  const pending = participants.filter(p => p.decksUsedToday < 4);
  const totalLeft = pending.reduce((s, p) => s + (4 - p.decksUsedToday), 0);
  const pct = Math.round((done.length / participants.length) * 100);

  const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));

  await postEmbed(webhook, {
    embeds: [{
      title: "📡 War Progress Update",
      description: `\`${bar}\` **${pct}%** complete\n\n${done.length}/${participants.length} pirates done · ${totalLeft} battles remaining`,
      color: pct >= 75 ? 0x39FF14 : pct >= 40 ? 0xF8D978 : 0xF87171,
      footer: { text: "Straw Hats Clash Royale · Hourly update" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Opponent Scouting ─────────────────────────────────────────────────────────

export async function notifyOpponentScout(opponent: {
  name: string; tag: string; fame: number; participants: number; clanScore: number;
}) {
  const webhook = await getWebhook("scout");
  if (!webhook) return;

  const SCOUT_LINES = [
    "Robin studied them. Here's what she found.",
    "Nami ran the numbers. Don't underestimate them.",
    "Zoro would ignore this intel. You shouldn't.",
    "Usopp scouted them. For once he's not exaggerating.",
  ];
  const flavor = SCOUT_LINES[Math.floor(Math.random() * SCOUT_LINES.length)];

  await postEmbed(webhook, {
    embeds: [{
      title: "🔍 Enemy Clan Intel",
      description: `*${flavor}*\n\nKnow your enemy before you fight them.`,
      color: 0xA78BFA,
      fields: [
        { name: "🏴‍☠️ Clan Name", value: opponent.name, inline: true },
        { name: "🏷️ Tag", value: opponent.tag, inline: true },
        { name: "⚔️ Current Fame", value: opponent.fame.toLocaleString(), inline: true },
        { name: "👥 Participants", value: String(opponent.participants), inline: true },
        { name: "🏆 Clan Score", value: opponent.clanScore > 0 ? opponent.clanScore.toLocaleString() : "N/A", inline: true },
      ],
      footer: { text: "Straw Hats Clash Royale · Scouting Report" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Quote of the Day ──────────────────────────────────────────────────────────

const ONE_PIECE_QUOTES = [
  { quote: "I'm gonna be King of the Pirates!", character: "Monkey D. Luffy" },
  { quote: "I don't want to conquer anything. I just think the guy with the most freedom on the seas is the King of the Pirates!", character: "Monkey D. Luffy" },
  { quote: "If you don't take risks, you can't create a future!", character: "Monkey D. Luffy" },
  { quote: "When the world shoves you around, you just gotta stand up and shove back.", character: "Roronoa Zoro" },
  { quote: "I'm going to be the world's greatest swordsman! All I have left is my destiny! My name may be infamous... but it's not a name I'm ashamed of!", character: "Roronoa Zoro" },
  { quote: "Only those who have suffered long can see the light within the shadows.", character: "Roronoa Zoro" },
  { quote: "There is someone that I must meet again. And until that day... not even Death itself can take my life away!", character: "Roronoa Zoro" },
  { quote: "You need to accept the fact that you're not the best and have all the will to strive to be better than anyone you face.", character: "Roronoa Zoro" },
  { quote: "Bring on the hardship. It's preferred in a path of carnage.", character: "Roronoa Zoro" },
  { quote: "Money is more important than anything else in this world. And nothing is more evil than to take it!", character: "Nami" },
  { quote: "Even if it means going to hell, I still have to go! I'm a pirate!", character: "Nami" },
  { quote: "I want to live! Take me out to sea with you!", character: "Nico Robin" },
  { quote: "I can't use a sword, lie, cheat, harm women, or go against my captain's wishes. That's all.", character: "Sanji" },
  { quote: "I won't kick a woman, even if I die for it.", character: "Sanji" },
  { quote: "Men who can't wipe away the tears from a women's eyes aren't real men.", character: "Sanji" },
  { quote: "You can spill drinks on me, even spit on me. I'll just laugh about it. But I won't let anyone hurt my friends!", character: "Tony Tony Chopper" },
  { quote: "Bring me another drink! Yohohoho! I am already dead! SKULL JOKE!", character: "Brook" },
  { quote: "SUPER!", character: "Franky" },
  { quote: "A man's dream will never die!", character: "Whitebeard" },
  { quote: "Power isn't determined by your size, but the size of your heart and dreams!", character: "Monkey D. Luffy" },
  { quote: "The world isn't perfect. But it's there for us, doing the best it can. That's what makes it so damn beautiful.", character: "Roy Mustang" },
  { quote: "Ace... lives on... within me.", character: "Monkey D. Luffy" },
  { quote: "People's dreams... have no end!", character: "Marshall D. Teach (Blackbeard)" },
  { quote: "These are the things I can't do. These are the things I won't do. And these are the things I absolutely will not do.", character: "Zeff" },
  { quote: "I've set myself to become the King of the Pirates... and if I die trying... then at least I tried!", character: "Monkey D. Luffy" },
  { quote: "Inherited Will, the Destiny of the Age, and the Dreams of its People. As long as people continue to pursue the meaning of Freedom, these things will never cease to be.", character: "Gol D. Roger" },
  { quote: "What keeps me going is knowing that somewhere out there, my nakama are still fighting.", character: "Monkey D. Luffy" },
  { quote: "Justice will prevail, you say? But of course it will! Whoever wins this war becomes justice!", character: "Doflamingo" },
  { quote: "There is no place on this ocean for a half-hearted dream.", character: "Shanks" },
  { quote: "Stop counting only those things you have lost. What is gone, is gone.", character: "Jinbe" },
];

export async function notifyDailyQuote() {
  const webhook = await getWebhook("quote");
  if (!webhook) return;

  const q = ONE_PIECE_QUOTES[Math.floor(Math.random() * ONE_PIECE_QUOTES.length)];

  await postEmbed(webhook, {
    embeds: [{
      title: "📜 Quote of the Day",
      description: `*"${q.quote}"*`,
      color: 0x5865F2,
      footer: { text: `— ${q.character} · Straw Hats Clash Royale` },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Donation Leaderboard ──────────────────────────────────────────────────────

export async function notifyDonationLeaderboard(members: Array<{
  tag: string; name: string; donations: number; donationsReceived: number;
}>) {
  const webhook = await getWebhook("donations");
  if (!webhook) return;

  const sorted = [...members].sort((a, b) => b.donations - a.donations);
  const top5 = sorted.slice(0, 5);
  const bottom3 = sorted.slice(-3).reverse();
  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

  const topLines = top5.map((m, i) =>
    `${medals[i]} **${m.name}** — ${m.donations.toLocaleString()} donated`
  ).join("\n");

  const bottomLines = bottom3
    .filter(m => m.donations < 20)
    .map(m => `💸 **${m.name}** — ${m.donations} donated *(Nami wants a word with you)*`)
    .join("\n");

  await postEmbed(webhook, {
    embeds: [{
      title: "💝 Weekly Donation Leaderboard",
      description: `*Sanji says donations are the love language of the crew.*\n\n${topLines}${bottomLines ? `\n\n**Stragglers:**\n${bottomLines}` : ""}`,
      color: 0xF472B6,
      footer: { text: "Straw Hats Clash Royale · Posted every Sunday" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Inactivity Alert ──────────────────────────────────────────────────────────

export async function notifyInactiveMembers(inactive: Array<{
  name: string; tag: string; donations: number; recentFame: number;
}>, threshold = 850) {
  const webhook = await getWebhook("inactive");
  if (!webhook) return;

  const lines = inactive
    .sort((a, b) => a.recentFame - b.recentFame)
    .map(m =>
      `💤 **${m.name}** — ${m.recentFame.toLocaleString()} fame (below ${threshold.toLocaleString()}) · ${m.donations} donations`
    ).join("\n");

  await postEmbed(webhook, {
    embeds: [{
      title: "😴 Low War Fame Alert",
      description: `These crew members scored below **${threshold.toLocaleString()} fame** this war. Not even Usopp would make these excuses.\n\n${lines}\n\n*Consider a conversation before the next war.*`,
      color: 0xFBBF24,
      footer: { text: "Straw Hats Clash Royale · Admin Alert" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Member Count Alert ────────────────────────────────────────────────────────

export async function notifyMemberCount(count: number, threshold: number) {
  const webhook = await getWebhook("member_count");
  if (!webhook) return;

  await postEmbed(webhook, {
    embeds: [{
      title: "⚠️ Crew is Running Low!",
      description: `The Thousand Sunny needs more nakama! We're down to **${count}/${threshold}** minimum crew.\n\n*Luffy recruited a whole pirate fleet in one arc. We can find a few more members.*\n\nTime to recruit — post in recruitment channels or check the CR recruitment boards.`,
      color: 0xF87171,
      fields: [
        { name: "Current Members", value: String(count), inline: true },
        { name: "Minimum Target", value: String(threshold), inline: true },
        { name: "Spots Open", value: String(50 - count), inline: true },
      ],
      footer: { text: "Straw Hats Clash Royale · Recruitment Alert" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Streak Milestone ──────────────────────────────────────────────────────────

const STREAK_FLAVOR: Record<number, string> = {
  5:  "5 wars in a row maxing all 16 decks and earning 1,800+ fame. Zoro is starting to notice you.",
  10: "10 consecutive elite wars. You fight like a Straw Hat first mate.",
  20: "20 wars of pure dominance. Absolute dedication. The crew would follow you anywhere.",
};

export async function notifyStreakMilestone(player: { name: string; tag: string }, streak: number) {
  const webhook = await getWebhook("streaks");
  if (!webhook) return;

  const flavor = STREAK_FLAVOR[streak] ?? `${streak} consecutive wars with all 16 decks used and 1,800+ fame.`;

  await postEmbed(webhook, {
    embeds: [{
      title: `🔥 ${streak}-War Elite Streak!`,
      description: `**${player.name}** has maxed all 16 decks and earned 1,800+ fame in **${streak} wars in a row**!\n\n*${flavor}*`,
      color: streak >= 20 ? 0x39FF14 : streak >= 10 ? 0xA78BFA : 0xFF6B00,
      footer: { text: "Straw Hats Clash Royale · Streak Achievement" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Pre-War Checklist ─────────────────────────────────────────────────────────

export async function notifyPreWarChecklist(hoursLeft: number, memberCount: number) {
  const webhook = await getWebhook("pre_war");
  if (!webhook) return;

  await postEmbed(webhook, {
    embeds: [{
      title: "📋 War Starts Soon — Prepare Your Decks!",
      description: `Training phase ends in approximately **${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}**.\n\n*Zoro sharpens his swords before every battle. Sanji rests his legs. What's your pre-war routine?*`,
      color: 0x22D3EE,
      fields: [
        { name: "✅ Check your deck is set", value: "Make sure your war deck is ready to go", inline: false },
        { name: "✅ Charge your device", value: "Nothing worse than dying mid-battle", inline: false },
        { name: "✅ Plan your 4 battles", value: `${memberCount} members are counting on you`, inline: false },
      ],
      footer: { text: "Straw Hats Clash Royale · Pre-War Reminder" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Bounty Board ─────────────────────────────────────────────────────────────

export async function notifyBountyBoard(
  top5: Array<{ name: string; tag: string; fame: number }>,
  warLabel: string,
) {
  const webhook = await getWebhook("bounty");
  if (!webhook) return;

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
  const lines = top5.map((p, i) =>
    `${medals[i]} **${p.name}** — ${p.fame.toLocaleString()} fame`
  ).join("\n");

  await postEmbed(webhook, {
    embeds: [{
      title: "🏴‍☠️ Bounty Board — Most Wanted",
      description: `*The Marines have updated their records. These pirates put up the biggest numbers ever recorded.*\n\n${lines}${warLabel ? `\n\n🏆 Top performance from **${warLabel}**` : ""}`,
      color: 0xF8D978,
      footer: { text: "Straw Hats Clash Royale · All-time best single-war fame" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Server Join Welcome (verification gate) ───────────────────────────────────

const JOIN_WELCOME_LINES = [
  "The Log Pose has pointed you here for a reason. Welcome aboard! 🧭",
  "Every great pirate crew starts with one person saying yes. That's you. 🏴‍☠️",
  "Luffy didn't ask questions when he recruited you. Neither do we. Set sail! ⛵",
  "Sanji's already cooking something to celebrate. Don't waste it. 🍖",
];

export async function notifyDiscordJoin(discordUsername: string) {
  const webhook = await getWebhook("welcome_gate");
  if (!webhook) return;

  const flavor = JOIN_WELCOME_LINES[Math.floor(Math.random() * JOIN_WELCOME_LINES.length)];

  await postEmbed(webhook, {
    embeds: [{
      title: "🏴‍☠️ A New Pirate Has Boarded!",
      description: `Welcome, **${discordUsername}**!\n\n*${flavor}*\n\nYou're currently **Unverified** and can only see this channel. Run \`/register <your player tag>\` to link your Clash Royale account, get your crew roles, and unlock the rest of the ship.`,
      color: 0x34D399,
      fields: [
        { name: "🗺️ Clan Tag", value: "#QPRQ88YP", inline: true },
      ],
      footer: { text: "Straw Hats Clash Royale · The sea is ours!" },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Kick Recommendation ───────────────────────────────────────────────────────

export async function notifyKickRecommendation(candidates: Array<{
  name: string; tag: string; avgFame: number; warsChecked: number;
}>, threshold = 1700) {
  const webhook = await getWebhook("kick_alert");
  if (!webhook) return;

  const lines = candidates.map(c =>
    `⚠️ **${c.name}** \`${c.tag}\` — avg **${c.avgFame.toLocaleString()}** fame over ${c.warsChecked} wars`
  ).join("\n");

  await postEmbed(webhook, {
    embeds: [{
      title: "🚨 Kick Recommendation — Admin Eyes Only",
      description: `The following members are averaging below **${threshold.toLocaleString()} fame** per war. Even Buggy tries harder.\n\n${lines}\n\n*Review their profiles on the war analysis page and consider a warning or removal.*`,
      color: 0xEF4444,
      footer: { text: "Straw Hats Clash Royale · Admin Alert · Handle with care" },
      timestamp: new Date().toISOString(),
    }],
  });
}
