import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("discord_channels")
    .select("*");

  if (error) return Response.json([], { status: 200 }); // table may not exist yet
  return Response.json(data ?? []);
}

export async function POST(req: Request) {
  const { feature, webhook_url, enabled } = await req.json();

  if (!feature) {
    return Response.json({ error: "feature is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("discord_channels")
    .upsert(
      { feature, webhook_url, enabled, updated_at: new Date().toISOString() },
      { onConflict: "feature" }
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
