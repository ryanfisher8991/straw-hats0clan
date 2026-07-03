// Registers/updates the Discord slash command list. Same command set as
// scripts/register-discord-commands.mjs — that script needs Discord secrets
// in .env.local which this repo doesn't have locally, so this route lets it
// be triggered against the already-configured production env vars instead.
// Protected the same way as the other cron/admin routes (CRON_SECRET bearer).

const CRON_SECRET = process.env.CRON_SECRET;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID!;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

const COMMANDS = [
  { name: "warcheck",  description: "Show who still needs to complete their war battles today" },
  { name: "warremind", description: "Manually send a war battle reminder to the reminders channel" },
  { name: "warday",    description: "Post the war day kickoff message immediately" },
  { name: "scout",     description: "Scout the current opponent clan and post their stats" },
  { name: "donations", description: "Post this week's donation leaderboard now" },
  { name: "inactive",  description: "Show members with low war fame" },
  { name: "streaks",   description: "Post the current battle streak leaderboard" },
  { name: "bounty",    description: "Post the all-time best single-war fame performances" },
  { name: "quote",     description: "Post a random One Piece quote to this channel" },
  { name: "setup",     description: "Show the bot setup guide and list of all available features" },
  {
    name: "register",
    description: "Link your Clash Royale account to your Discord profile and get your clan roles",
    options: [
      { name: "tag", description: "Your Clash Royale player tag — paste it as-is, e.g. #ABC123 or ABC123", type: 3, required: true },
    ],
  },
  {
    name: "whois",
    description: "Look up which Clash Royale account a Discord member has registered",
    options: [
      { name: "user", description: "The Discord user to look up", type: 6, required: true },
    ],
  },
  {
    name: "admin-preview-resync",
    description: "[Admin] Preview the one-time role cleanup without changing anything",
    default_member_permissions: "268435456", // MANAGE_ROLES
  },
  {
    name: "admin-apply-resync",
    description: "[Admin] Apply the one-time role cleanup — strips ad-hoc roles, sets Unverified/rank roles",
    default_member_permissions: "268435456", // MANAGE_ROLES
  },
  {
    name: "admin-register",
    description: "[Admin] Register another member's Clash Royale account on their behalf",
    default_member_permissions: "268435456", // MANAGE_ROLES
    options: [
      { name: "user", description: "The Discord user to register", type: 6, required: true },
      { name: "tag", description: "Their Clash Royale player tag — e.g. #ABC123 or ABC123", type: 3, required: true },
    ],
  },
  {
    name: "admin-list-members",
    description: "[Admin] List every registered member and their player tag",
    default_member_permissions: "268435456", // MANAGE_ROLES
  },
];

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = DISCORD_GUILD_ID
    ? `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/guilds/${DISCORD_GUILD_ID}/commands`
    : `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`;

  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(COMMANDS),
  });

  const data = await res.json();
  if (!res.ok) {
    return Response.json({ error: data }, { status: 500 });
  }

  return Response.json({
    ok: true,
    registered: COMMANDS.length,
    scope: DISCORD_GUILD_ID ? `guild ${DISCORD_GUILD_ID}` : "global",
    commands: Array.isArray(data) ? data.map((c: { name: string }) => c.name) : data,
  });
}
