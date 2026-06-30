import { getClan, getClanMembers, getClanLocalRank, getCurrentRiverRace } from "@/lib/cr-api";
import { supabase } from "@/lib/supabase";
import { Trophy, Users, Swords, Heart, Crown, MapPin, Globe, ExternalLink } from "lucide-react";
import type { ClanMember } from "@/types/clash";
import SpotlightCards from "./SpotlightCards";

export const revalidate = 300;

const CLAN_TAG = "#QPRQ88YP";

async function getData() {
  try {
    const [clan, membersRes, localRank, raceRes] = await Promise.allSettled([
      getClan(),
      getClanMembers(),
      getClanLocalRank(),
      getCurrentRiverRace(),
    ]);
    return {
      clan: clan.status === "fulfilled" ? clan.value : null,
      members: membersRes.status === "fulfilled" ? membersRes.value?.items ?? [] : [],
      localRank: localRank.status === "fulfilled" ? localRank.value : null,
      race: raceRes.status === "fulfilled" ? raceRes.value : null,
    };
  } catch {
    return { clan: null, members: [], localRank: null, race: null };
  }
}

async function getMostImproved(currentMemberTags: Set<string>): Promise<{ name: string; delta: number } | null> {
  // Get the last 2 completed war snapshots
  const { data: snapshots } = await supabase
    .from("war_snapshots")
    .select("id")
    .order("snapshotted_at", { ascending: false })
    .limit(2);

  if (!snapshots || snapshots.length < 2) return null;

  const [latestId, previousId] = snapshots.map(s => s.id);

  const { data: stats } = await supabase
    .from("war_member_stats")
    .select("player_tag, player_name, fame, snapshot_id")
    .in("snapshot_id", [latestId, previousId]);

  if (!stats?.length) return null;

  const latestFame = new Map<string, { name: string; fame: number }>();
  const previousFame = new Map<string, number>();

  for (const row of stats) {
    if (row.snapshot_id === latestId) latestFame.set(row.player_tag, { name: row.player_name, fame: row.fame });
    if (row.snapshot_id === previousId) previousFame.set(row.player_tag, row.fame);
  }

  let bestTag = "";
  let bestDelta = -Infinity;

  for (const [tag, { fame }] of latestFame) {
    // Must appear in both wars (not a new member) AND still be in the clan
    if (!previousFame.has(tag)) continue;
    if (!currentMemberTags.has(tag)) continue;
    const delta = fame - previousFame.get(tag)!;
    if (delta > bestDelta) { bestDelta = delta; bestTag = tag; }
  }

  if (!bestTag || bestDelta <= 0) return null;
  return { name: latestFame.get(bestTag)!.name, delta: bestDelta };
}

async function getTrophyDeltas(): Promise<Map<string, number>> {
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("member_snapshots")
    .select("player_tag, trophies, snapshotted_at")
    .gte("snapshotted_at", cutoff)
    .order("snapshotted_at", { ascending: false });

  if (!data || data.length === 0) return new Map();

  const byTag = new Map<string, { newest: number; oldest: number }>();
  for (const row of data) {
    const existing = byTag.get(row.player_tag);
    if (!existing) {
      byTag.set(row.player_tag, { newest: row.trophies, oldest: row.trophies });
    } else {
      existing.oldest = row.trophies;
    }
  }

  const deltas = new Map<string, number>();
  for (const [tag, { newest, oldest }] of byTag) {
    deltas.set(tag, newest - oldest);
  }
  return deltas;
}

export default async function DashboardPage() {
  const [{ clan, members, localRank, race }, trophyDeltas] = await Promise.all([
    getData(),
    getTrophyDeltas(),
  ]);

  const currentMemberTags = new Set<string>(members.map((m: ClanMember) => m.tag));
  const mostImproved = await getMostImproved(currentMemberTags);

  // War Hero: top fame participant in current race, fall back to last snapshot
  const raceParticipants: { tag: string; name: string; fame: number }[] =
    race?.clan?.tag === CLAN_TAG
      ? race.clan.participants ?? []
      : race?.clans?.find((c: { tag: string }) => c.tag === CLAN_TAG)?.participants ?? [];

  const topFameParticipant = raceParticipants
    .filter((p) => p.fame > 0)
    .sort((a, b) => b.fame - a.fame)[0] ?? null;

  let warHero: { name: string; fame: number } | null = topFameParticipant
    ? { name: topFameParticipant.name, fame: topFameParticipant.fame }
    : null;

  // No live fame yet (training phase / war just reset) — use last snapshot
  if (!warHero) {
    const { data: lastSnapshot } = await supabase
      .from("war_snapshots")
      .select("id")
      .order("snapshotted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSnapshot) {
      const { data: topStat } = await supabase
        .from("war_member_stats")
        .select("player_name, fame")
        .eq("snapshot_id", lastSnapshot.id)
        .order("fame", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (topStat && topStat.fame > 0) {
        warHero = { name: topStat.player_name, fame: topStat.fame };
      }
    }
  }

  // Top Donor: highest donations this week
  const sortedByDonation = [...members].sort(
    (a: ClanMember, b: ClanMember) => b.donations - a.donations
  );
  const topDonor = sortedByDonation[0]?.donations > 0
    ? { name: sortedByDonation[0].name, donations: sortedByDonation[0].donations }
    : null;

  // Rising Star: biggest trophy gain in last 14 days
  let risingStar: { name: string; delta: number } | null = null;
  if (trophyDeltas.size > 0) {
    let bestTag = "";
    let bestDelta = 0;
    for (const [tag, delta] of trophyDeltas) {
      if (delta > bestDelta) { bestDelta = delta; bestTag = tag; }
    }
    const starMember = bestTag ? members.find((m: ClanMember) => m.tag === bestTag) : null;
    if (starMember && bestDelta > 0) {
      risingStar = { name: starMember.name, delta: bestDelta };
    }
  }

  const topDonors: ClanMember[] = sortedByDonation.slice(0, 5);

  const rankChanged = localRank && localRank.rank !== localRank.previousRank;
  const rankUp = localRank && localRank.rank < localRank.previousRank;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">

      {/* Page header */}
      <div className="mb-8 animate-fade-up" style={{ opacity: 0, animationDelay: "0.05s" }}>
        <h1 className="font-display text-2xl sm:text-3xl text-gold-gradient mb-1">War Room</h1>
        <p className="text-text-muted text-sm font-body">
          {clan?.name ?? "The Straw Hats"} · Live clan overview
        </p>
      </div>

      {/* Spotlight cards */}
      <SpotlightCards warHero={warHero} topDonor={topDonor} risingStar={risingStar} mostImproved={mostImproved} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Members",      value: clan?.members ?? members.length, sub: "of 50",        icon: Users,  color: "text-blue-clash",   delay: "0.1s"  },
          { label: "War Trophies", value: clan?.clanWarTrophies?.toLocaleString() ?? "—",        sub: "all-time",     icon: Swords, color: "text-gold-400",   delay: "0.15s" },
          { label: "Clan Score",   value: clan?.clanScore?.toLocaleString() ?? "—",              sub: "trophy score", icon: Trophy, color: "text-red-clash",  delay: "0.2s"  },
          { label: "Donations",    value: clan?.donationsPerWeek?.toLocaleString() ?? "—",       sub: "this week",    icon: Heart,  color: "text-green-clash", delay: "0.25s" },
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

      {/* Rankings row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card-base stat-card-glow p-5 animate-fade-up" style={{ opacity: 0, animationDelay: "0.3s" }}>
          <div className="flex items-start justify-between mb-3">
            <p className="font-heading text-[0.65rem] tracking-[0.15em] text-text-muted uppercase">Local Rank</p>
            <MapPin size={16} className="text-blue-clash" strokeWidth={1.5} />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="font-display text-2xl text-gold-gradient">
              {localRank ? `#${localRank.rank}` : "—"}
            </p>
            {rankChanged && (
              <span className={`font-heading text-xs ${rankUp ? "text-green-clash" : "text-red-clash"}`}>
                {rankUp ? "▲" : "▼"} {Math.abs(localRank!.rank - localRank!.previousRank)}
              </span>
            )}
          </div>
          <p className="text-text-muted text-xs mt-1 font-body">{localRank?.locationName ?? "North America"}</p>
        </div>

        <div className="card-base stat-card-glow p-5 animate-fade-up" style={{ opacity: 0, animationDelay: "0.35s" }}>
          <div className="flex items-start justify-between mb-3">
            <p className="font-heading text-[0.65rem] tracking-[0.15em] text-text-muted uppercase">Global Rank</p>
            <Globe size={16} className="text-text-muted" strokeWidth={1.5} />
          </div>
          <p className="font-display text-2xl text-text-muted">Outside</p>
          <p className="text-text-muted text-xs mt-1 font-body">Top 1,000 globally</p>
        </div>
      </div>

      {/* Discord invite */}
      <a
        href="https://discord.gg/Z8SXC5KMEJ"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-4 card-base p-5 mb-4 animate-fade-up border-navy-500 hover:border-[#5865f2]/50 transition-colors duration-300"
        style={{ opacity: 0, animationDelay: "0.38s" }}
      >
        <div className="flex items-center gap-4">
          {/* Discord logo SVG */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(88,101,242,0.15)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="#5865f2"/>
            </svg>
          </div>
          <div>
            <p className="font-heading text-sm text-text-primary tracking-wide">Join the Discord</p>
            <p className="font-body text-xs text-text-muted mt-0.5">Clan chat, war reminders &amp; bot commands</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-heading text-xs tracking-wider px-3 py-1.5 rounded-lg transition-colors duration-300" style={{ background: "rgba(88,101,242,0.15)", color: "#818cf8" }}>
            discord.gg/Z8SXC5KMEJ
          </span>
          <ExternalLink size={14} className="text-text-muted group-hover:text-[#818cf8] transition-colors duration-300" strokeWidth={1.5} />
        </div>
      </a>

      {/* Top donors */}
      <div className="card-base p-6 animate-fade-up" style={{ opacity: 0, animationDelay: "0.4s" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-sm tracking-wider text-text-primary">Top Donors</h2>
          <Heart size={15} className="text-red-clash" strokeWidth={1.5} />
        </div>
        {topDonors.length > 0 ? (
          <div className="space-y-1.5">
            {topDonors.map((m: ClanMember, i: number) => {
              const roleColors: Record<string, string> = {
                leader:   "bg-gold-700 text-gold-300",
                coLeader: "bg-navy-600 text-blue-clash",
                elder:    "bg-navy-600 text-text-secondary",
                member:   "bg-navy-700 text-text-muted",
              };
              return (
                <div key={m.tag} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-navy-800 border border-navy-500">
                  <span className="font-display text-xs text-gold-600 w-4 text-center">{i + 1}</span>
                  {i === 0 && <Crown size={12} className="text-gold-400 -ml-1 shrink-0" />}
                  <span className="flex-1 font-body text-sm text-text-primary truncate">{m.name}</span>
                  <span className={`badge-role ${roleColors[m.role] ?? roleColors.member}`}>
                    {m.role === "coLeader" ? "Co-Leader" : m.role}
                  </span>
                  <span className="font-heading text-xs text-gold-400 ml-1">{m.donations.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted font-body text-sm">Loading member data...</div>
        )}
      </div>
    </div>
  );
}
