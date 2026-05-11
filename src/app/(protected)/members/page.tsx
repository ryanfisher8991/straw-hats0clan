import { getClan, getClanMembers, getCurrentRiverRace, getRiverRaceLog } from "@/lib/cr-api";
import { supabase } from "@/lib/supabase";
import { Users, Trophy, Heart, TrendingUp } from "lucide-react";
import MembersClient from "./MembersClient";

export const revalidate = 300;

// Baseline covers through this date (spreadsheet seed through 5/3/26).
// Any race with createdDate on or after this is post-baseline and must be counted.
// Format matches CR API createdDate prefix: "YYYYMMDD"
const BASELINE_END_CRDATE = "20260504";
const CLAN_TAG_PLAIN = "#QPRQ88YP";

function normName(n: string) {
  return n.toLowerCase().replace(/0/g, "o").replace(/[\s._-]/g, "");
}

async function getData() {
  const [clan, membersRes, raceRes, logRes, baselineRes] = await Promise.allSettled([
    getClan(),
    getClanMembers(),
    getCurrentRiverRace(),
    getRiverRaceLog(),
    supabase.from("fame_baseline").select("player_name, player_tag, baseline_fame"),
  ]);

  const members = membersRes.status === "fulfilled" ? membersRes.value?.items ?? [] : [];

  // --- Current race (live, in progress) ---
  const currentRace = raceRes.status === "fulfilled" ? raceRes.value : null;
  const currentParticipants: { tag: string; fame: number }[] =
    currentRace?.clan?.tag === CLAN_TAG_PLAIN
      ? currentRace.clan.participants ?? []
      : currentRace?.clans?.find((c: { tag: string }) => c.tag === CLAN_TAG_PLAIN)?.participants ?? [];
  const currentFameByTag = new Map<string, number>();
  for (const p of currentParticipants) {
    if (p.fame > 0) currentFameByTag.set(p.tag, p.fame);
  }

  // --- Historical baseline ---
  const baselineRows =
    baselineRes.status === "fulfilled" ? baselineRes.value.data ?? [] : [];
  const baselineByName = new Map<string, number>();
  const baselineByNorm = new Map<string, number>();
  const baselineByTag = new Map<string, number>();
  for (const row of baselineRows) {
    baselineByName.set(row.player_name.toLowerCase(), row.baseline_fame);
    baselineByNorm.set(normName(row.player_name), row.baseline_fame);
    if (row.player_tag) baselineByTag.set(row.player_tag, row.baseline_fame);
  }

  // --- Completed post-baseline races from the live API race log ---
  // The race log only contains completed races (not the current one), so no
  // double-counting with currentFameByTag. We pull directly from the API so
  // data is always fresh regardless of when the Supabase cron last ran.
  const raceLog = logRes.status === "fulfilled" ? logRes.value : null;
  const completedRaces = (raceLog?.items ?? []).filter(
    (r: { createdDate: string }) => r.createdDate >= BASELINE_END_CRDATE
  );
  const completedFameByTag = new Map<string, number>();
  for (const race of completedRaces) {
    const ourEntry = (race.standings ?? []).find(
      (s: { clan: { tag: string } }) => s.clan?.tag === CLAN_TAG_PLAIN
    );
    const participants: { tag: string; fame: number }[] = ourEntry?.clan?.participants ?? [];
    for (const p of participants) {
      completedFameByTag.set(p.tag, (completedFameByTag.get(p.tag) ?? 0) + p.fame);
    }
  }

  // --- Combine: baseline + completed post-baseline + current race ---
  const lifetimeFame: Record<string, number> = {};
  for (const m of members) {
    const base = baselineByTag.get(m.tag)
      ?? baselineByName.get(m.name.toLowerCase())
      ?? baselineByNorm.get(normName(m.name))
      ?? 0;
    const completed = completedFameByTag.get(m.tag) ?? 0;
    const current = currentFameByTag.get(m.tag) ?? 0;
    const total = base + completed + current;
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
