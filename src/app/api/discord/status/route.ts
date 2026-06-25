/** Returns whether the Discord webhook is configured. */
export async function GET() {
  const webhookConfigured = !!process.env.DISCORD_WEBHOOK_URL;
  const botConfigured     = !!process.env.DISCORD_BOT_TOKEN && !!process.env.DISCORD_PUBLIC_KEY;
  const appId             = process.env.DISCORD_APPLICATION_ID ?? null;

  return Response.json({ webhookConfigured, botConfigured, appId });
}
