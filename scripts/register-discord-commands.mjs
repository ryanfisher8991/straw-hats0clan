import { readFileSync } from "fs";
try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
} catch { /* no .env.local, rely on process.env */ }

const { DISCORD_BOT_TOKEN, DISCORD_APPLICATION_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_BOT_TOKEN || !DISCORD_APPLICATION_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_APPLICATION_ID in .env.local");
  process.exit(1);
}

const commands = [
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
      {
        name: "tag",
        description: "Your Clash Royale player tag (e.g. ABC123 — no # needed)",
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: "whois",
    description: "Look up which Clash Royale account a Discord member has registered",
    options: [
      {
        name: "user",
        description: "The Discord user to look up",
        type: 6,
        required: true,
      },
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
];

const url = DISCORD_GUILD_ID
  ? `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/guilds/${DISCORD_GUILD_ID}/commands`
  : `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`;

const res = await fetch(url, {
  method: "PUT",
  headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify(commands),
});

const data = await res.json();
if (!res.ok) { console.error("Failed:", JSON.stringify(data, null, 2)); process.exit(1); }

console.log(`✅ Registered ${commands.length} commands${DISCORD_GUILD_ID ? ` to guild ${DISCORD_GUILD_ID}` : " globally"}`);
for (const cmd of data) console.log(`  /${cmd.name}`);
