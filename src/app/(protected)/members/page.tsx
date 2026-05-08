import { getClan, getClanMembers, getCurrentRiverRace } from "@/lib/cr-api";
import { supabase } from "@/lib/supabase";
import { Users, Trophy, Heart, TrendingUp } from "lucide-react";
import MembersClient from "./MembersClient";

export const revalidate = 300;

// Baseline cutoff: spreadsheet covers through this date
const BASELINE_CUTOFF = "2026-05-04T00:00:00Z";

async function getData() {
  const [clan, membersRes, raceRes] = await Promise.allSettled([
    getClan(),
    getClanMembers(),
    getCurrentRiverRace(),
  ]);

  const members = membersRes.status === "fulfilled" ? membersRes.value?.items ?? [] : [];

  // Current race fame (in progress this week)
  const currentRace = raceRes.status === "fulfilled" ? raceRes.value : null;
  const CLAN_TAG = "#QPRQ88YP";
  const currentParticipants: { tag: string; fame: number }[] =
    currentRace?.clan?.tag === CLAN_TAG
      ? currentRace.clan.participants ?? []
      : currentRace?.clans?.find((c: { tag: string }) => c.tag === CLAN_TAG)?.participants ?? [];
  const currentFameByTag = new Map<string, number>();
  for (const p of currentParticipants) {
    if (p.fame > 0) currentFameByTag.set(p.tag, p.fame);
  }

  // Fetch historical baseline (from spreadsheet seed)
  const { data: baselineRows } = await supabase
    .from("fame_baseline")
    .select("player_name, player_tag, baseline_fame");

  // Normalize names for fuzzy matching: lowercase, 0→o, remove spaces/dots/underscores
  function normName(n: string) {
    return n.toLowerCase().replace(/0/g, "o").replace(/[\s._-]/g, "");
  }

  // Build lookup: exact lowercase name → fame, normalized name → fame, tag → fame
  const baselineByName = new Map<string, number>();
  const baselineByNorm = new Map<string, number>();
  const baselineByTag = new Map<string, number>();
  for (const row of baselineRows ?? []) {
    baselineByName.set(row.player_name.toLowerCase(), row.baseline_fame);
    baselineByNorm.set(normName(row.player_name), row.baseline_fame);
    if (row.player_tag) baselineByTag.set(row.player_tag, row.baseline_fame);
  }

  // Get snapshot IDs for races strictly AFTER the baseline — exclude any race
  // whose createdDate falls on or before the last spreadsheet entry (5/3/26).
  // We use 5/10 as the cutoff (end of the current race week) so that only
  // fully new races (next week onwards) count here; the current race is handled
  // live via getCurrentRiverRace() below.
  const NEW_RACES_CUTOFF = "2026-05-10T00:00:00Z";
  const { data: recentSnapshots } = await supabase
    .from("war_snapshots")
    .select("id")
    .gte("snapshotted_at", NEW_RACES_CUTOFF);

  const recentFameByTag = new Map<string, number>();
  if (recentSnapshots && recentSnapshots.length > 0) {
    const snapshotIds = recentSnapshots.map((s: { id: string }) => s.id);
    const { data: recentStats } = await supabase
      .from("war_member_stats")
      .select("player_tag, fame")
      .in("snapshot_id", snapshotIds);

    for (const row of recentStats ?? []) {
      recentFameByTag.set(row.player_tag, (recentFameByTag.get(row.player_tag) ?? 0) + row.fame);
    }
  }

  // Combine: baseline + completed races after cutoff + current race in progress
  const lifetimeFame: Record<string, number> = {};
  for (const m of members) {
    const base = baselineByTag.get(m.tag)
      ?? baselineByName.get(m.name.toLowerCase())
      ?? baselineByNorm.get(normName(m.name))
      ?? 0;
    const recent = recentFameByTag.get(m.tag) ?? 0;
    const current = currentFameByTag.get(m.tag) ?? 0;
    const total = base + recent + current;
    if (total > 0) lifetimeFame[m.tag] = total;
  }

  return {
    clan: clan.status === "fulfilled" ? clan.value : null,
    members,
    lifetimeFame,
  };
}

async function getTrophyDeltas(): Promise<Record<string, number>> {
  // Fetch snapshots from the last 14 days, ordered newest first
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("member_snapshots")
    .select("player_tag, trophies, snapshotted_at")
    .gte("snapshotted_at", cutoff)
    .order("snapshotted_at", { ascending: false });

  if (!data || data.length === 0) return {};

  // Group by player_tag, take newest and oldest snapshot
  const byTag = new Map<string, { newest: number; oldest: number }>();
  for (const row of data) {
    const existing = byTag.get(row.player_tag);
    if (!existing) {
      byTag.set(row.player_tag, { newest: row.trophies, oldest: row.trophies });
    } else {
      // data is sorted newest first, so oldest is always the last one we see
      existing.oldest = row.trophies;
    }
  }

  const deltas: Record<string, number> = {};
  for (const [tag, { newest, oldest }] of byTag) {
    deltas[tag] = newest - oldest;
  }
  return deltas;
}

export default async function MembersPage() {
  const [{ clan, members, lifetimeFame }, trophyDeltas] = await Promise.all([
    getData(),
    getTrophyDeltas(),
  ]);

  const totalDonations = members.reduce((s: number, m: { donations: number }) => s + m.donations, 0);
  const avgTrophies = members.length
    ? Math.round(members.reduce((s: number, m: { trophies: number }) => s + m.trophies, 0) / members.length)
    : 0;
  const topTrophies = members.length
    ? Math.max(...members.map((m: { trophies: number }) => m.trophies))
    : 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8 animate-fade-up" style={{ opacity: 0, animationDelay: "0.05s" }}>
        <h1 className="font-display text-2xl sm:text-3xl text-gold-gradient mb-1">Members</h1>
        <p className="text-text-muted text-sm font-body">
          {clan?.name ?? "The Straw Hats"} · {members.length} / 50 members
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Members",      value: members.length,                sub: "of 50",       icon: Users,       color: "text-blue-clash",   delay: "0.1s"  },
          { label: "Avg Trophies", value: avgTrophies.toLocaleString(),   sub: "per member",  icon: Trophy,      color: "text-gold-400",     delay: "0.15s" },
          { label: "Top Trophies", value: topTrophies.toLocaleString(),   sub: "highest",     icon: TrendingUp,  color: "text-red-clash",    delay: "0.2s"  },
          { label: "Total Donated",value: totalDonations.toLocaleString(),sub: "this week",   icon: Heart,       color: "text-green-clash",  delay: "0.25s" },
        ].map(({ label, value, sub, icon: Icon, color, delay }) => (
          <div key={label} className="card-base stat-card-glow p-5 animate-fade-up" style={{ opacity: 0, animationDelay: delay }}>
            <div className="flex items-start justify-between mb-3">
              <p className="font-heading text-[0.65rem] tracking-[0.15em] text-text-muted uppercase">{label}</p>
              <Icon size={16} className={color} strokeWidth={1.5} />
            </div>
            <p className="font-display text-2xl text-gold-gradient">{value}</p>
            <p className="text-text-muted text-xs mt-1 font-body">{sub}</p>
          </div>
        ))}
      </div>

      <div className="animate-fade-up" style={{ opacity: 0, animationDelay: "0.3s" }}>
        <MembersClient members={members} lifetimeFame={lifetimeFame} trophyDeltas={trophyDeltas} />
      </div>
    </div>
  );
}
