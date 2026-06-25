import { getCurrentRiverRace, getClanMembers } from "@/lib/cr-api";

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL!;
const CRON_SECRET = process.env.CRON_SECRET;

interface Participant {
  tag: string;
  name: string;
  fame: number;
  decksUsedToday: number;
  decksUsed: number;
  boatAttacks: number;
}

export async function GET(req: Request) {
  // Secure the endpoint — Vercel sends CRON_SECRET as Authorization header
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const race = await getCurrentRiverRace();
    const state: string = race?.state ?? "";

    // Only remind during active war day
    if (state !== "warDay") {
      return Response.json({
        skipped: true,
        reason: `War state is "${state}", not warDay`,
      });
    }

    // Get current clan members so we only ping active members (not ex-members)
    const clanData = await getClanMembers();
    const activeTags = new Set<string>(
      (clanData?.items ?? []).map((m: { tag: string }) => m.tag)
    );

    const participants: Participant[] = race?.clan?.participants ?? [];

    // Filter to current members with remaining battles today
    const needBattle = participants
      .filter((p) => activeTags.has(p.tag) && p.decksUsedToday < 4)
      .sort((a, b) => a.decksUsedToday - b.decksUsedToday); // fewest battles first

    const doneBattle = participants.filter(
      (p) => activeTags.has(p.tag) && p.decksUsedToday >= 4
    );

    if (needBattle.length === 0) {
      await postToDiscord({
        embeds: [{
          title: "🏴‍☠️ The Crew Delivered!",
          description: `All **${doneBattle.length}** Straw Hats finished their war battles today. Not a single pirate stood down.\n\n*"I don't want to conquer anything. I just think the guy with the most freedom on the seas is the King of the Pirates!"* — Luffy`,
          color: 0x39ff14,
          footer: { text: "Straw Hats Clash Royale" },
          timestamp: new Date().toISOString(),
        }],
      });
      return Response.json({ sent: true, allDone: true });
    }

    const battlesLeft = (p: Participant) => 4 - p.decksUsedToday;

    const needLines = needBattle
      .map((p) => {
        const done = p.decksUsedToday;
        const left = battlesLeft(p);
        const bar = "🟩".repeat(done) + "⬛".repeat(left);
        return `${bar} **${p.name}** — ${done}/4 done (${left} left)`;
      })
      .join("\n");

    const totalLeft = needBattle.reduce((s, p) => s + battlesLeft(p), 0);

    const REMINDER_LINES = [
      "The Log Pose doesn't wait. Neither does the war clock. ⏰",
      "Even Usopp would've battled by now. Get in there. 🎯",
      "Zoro got lost again — what's your excuse? 🗡️",
      "Nami is calculating how much this costs the crew. Don't make her. 💰",
      "Luffy's already eaten and is ready to fight. Are you? 🥩",
    ];
    const flavor = REMINDER_LINES[Math.floor(Math.random() * REMINDER_LINES.length)];

    await postToDiscord({
      embeds: [{
        title: "⚔️ War Battle Reminder",
        description: [
          `*${flavor}*\n`,
          `**${needBattle.length}** crew member${needBattle.length === 1 ? "" : "s"} still need${needBattle.length === 1 ? "s" : ""} to fight (${totalLeft} battles remaining):\n`,
          needLines,
          `\n✅ ${doneBattle.length} pirate${doneBattle.length === 1 ? "" : "s"} already fought today.`,
        ].join("\n"),
        color: 0xfbbf24,
        footer: { text: "Straw Hats Clash Royale · Don't let the crew down!" },
        timestamp: new Date().toISOString(),
      }],
    });

    return Response.json({
      sent: true,
      needBattle: needBattle.length,
      doneBattle: doneBattle.length,
      totalBattlesLeft: totalLeft,
    });
  } catch (err) {
    console.error("Discord remind error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

// Also allow manual POST trigger from the website
export const POST = GET;

async function postToDiscord(payload: object) {
  if (!WEBHOOK_URL) throw new Error("DISCORD_WEBHOOK_URL not set");
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook failed ${res.status}: ${text}`);
  }
}
