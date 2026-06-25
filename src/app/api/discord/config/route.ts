import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data } = await supabase.from("discord_config").select("*");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return Response.json(map);
}

export async function POST(req: Request) {
  const body = await req.json() as Record<string, string>;
  const rows = Object.entries(body).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("discord_config")
    .upsert(rows, { onConflict: "key" });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
