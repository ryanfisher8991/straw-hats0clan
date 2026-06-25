/**
 * Run once to register slash commands with Discord:
 *   node scripts/register-discord-commands.mjs
 *
 * Requires these env vars (copy from .env.local):
 *   DISCORD_BOT_TOKEN
 *   DISCORD_APPLICATION_ID
 *   DISCORD_GUILD_ID   (optional — guild commands update instantly; global commands take ~1 hour)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const { DISCORD_BOT_TOKEN, DISCORD_APPLICATION_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_BOT_TOKEN || !DISCORD_APPLICATION_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_APPLICATION_ID in .env.local");
  process.exit(1);
}

const commands = [
  {
    name: "warcheck",
    description: "Show who still needs to do their war battles today",
  },
  {
    name: "warremind",
    description: "Send the war battle reminder to the reminder channel",
  },
];

// Guild commands update instantly; global commands take ~1 hour to propagate
const url = DISCORD_GUILD_ID
  ? `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/guilds/${DISCORD_GUILD_ID}/commands`
  : `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`;

console.log(`Registering ${commands.length} commands at: ${url}`);

const res = await fetch(url, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(commands),
});

const data = await res.json();

if (!res.ok) {
  console.error("Failed to register commands:", JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("Successfully registered commands:");
for (const cmd of data) {
  console.log(`  /${cmd.name} — ${cmd.description}`);
}
