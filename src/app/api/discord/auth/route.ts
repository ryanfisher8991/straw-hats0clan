export async function POST(req: Request) {
  const { password } = await req.json();
  const correct = process.env.DISCORD_PAGE_PASSWORD;

  if (!correct) {
    return Response.json({ error: "DISCORD_PAGE_PASSWORD not set" }, { status: 500 });
  }

  if (password !== correct) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  return Response.json({ ok: true });
}
