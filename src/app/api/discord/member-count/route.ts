import { getClanMembers } from "@/lib/cr-api";
import { supabase } from "@/lib/supabase";
import { notifyMemberCount } from "@/lib/discord-notify";

export async function GET() { return handler(); }
export async function POST() { return handler(); }

async function handler() {
  try {
    const res = await getClanMembers();
    const members: Array<{ tag: string }> = res?.items ?? [];
    const count = members.length;

    // Read threshold from discord_config
    const { data: cfg } = await supabase
      .from("discord_config")
      .select("value")
      .eq("key", "member_count_threshold")
      .maybeSingle();

    const threshold = parseInt(cfg?.value ?? "45", 10);

    if (count >= threshold) {
      return Response.json({ skipped: true, count, threshold, reason: "Above threshold" });
    }

    await notifyMemberCount(count, threshold);
    return Response.json({ ok: true, count, threshold });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
