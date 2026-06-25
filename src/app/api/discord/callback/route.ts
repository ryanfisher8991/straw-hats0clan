/**
 * OAuth2 callback after the user adds the bot to their server.
 * Discord redirects here with ?code=...&guild_id=...
 *
 * We:
 *  1. Exchange the code for an access token (validates the flow)
 *  2. Use the bot token to list the guild's channels
 *  3. Create a webhook in the best available channel
 *  4. Redirect to /discord?setup=success&webhook=<encoded-url>
 */

const APP_ID   = process.env.DISCORD_APPLICATION_ID!;
const SECRET   = process.env.DISCORD_CLIENT_SECRET!;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code    = searchParams.get("code");
  const guildId = searchParams.get("guild_id");
  const error   = searchParams.get("error");

  if (error) {
    return Response.redirect(`${APP_URL}/discord?setup=cancelled`);
  }

  if (!code || !guildId) {
    return Response.redirect(`${APP_URL}/discord?setup=error&reason=missing_params`);
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: APP_ID,
        client_secret: SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${APP_URL}/api/discord/callback`,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }

    // 2. Fetch guild channels via bot token
    const channelsRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );

    if (!channelsRes.ok) {
      throw new Error(`Could not fetch channels: ${channelsRes.status}`);
    }

    const channels: Array<{ id: string; name: string; type: number }> =
      await channelsRes.json();

    // Pick the best channel: prefer #war-reminders, #clan-bot, #general — text channels only (type 0)
    const PREFERRED = ["war-reminders", "war", "clan-bot", "bot", "general", "chat"];
    const textChannels = channels.filter((c) => c.type === 0);

    const target =
      PREFERRED.reduce<(typeof textChannels)[0] | null>((found, name) => {
        if (found) return found;
        return textChannels.find((c) => c.name.toLowerCase().includes(name)) ?? null;
      }, null) ?? textChannels[0];

    if (!target) {
      throw new Error("No text channels found in the server");
    }

    // 3. Create a webhook in the chosen channel
    const webhookRes = await fetch(
      `https://discord.com/api/v10/channels/${target.id}/webhooks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Straw Hats War Bot",
          avatar: null,
        }),
      }
    );

    if (!webhookRes.ok) {
      const errBody = await webhookRes.text();
      throw new Error(`Webhook creation failed ${webhookRes.status}: ${errBody}`);
    }

    const webhook = await webhookRes.json();
    const webhookUrl = `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`;

    // 4. Redirect back to the setup page with the webhook URL
    const params = new URLSearchParams({
      setup: "success",
      channel: target.name,
      webhook: webhookUrl,
    });
    return Response.redirect(`${APP_URL}/discord?${params}`);
  } catch (err) {
    console.error("Discord callback error:", err);
    const params = new URLSearchParams({
      setup: "error",
      reason: String(err),
    });
    return Response.redirect(`${APP_URL}/discord?${params}`);
  }
}
