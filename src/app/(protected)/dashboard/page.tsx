import { getClan, getClanMembers, getClanLocalRank, getCurrentRiverRace } from "@/lib/cr-api";
import { supabase } from "@/lib/supabase";
import { Trophy, Users, Swords, Heart, Crown, MapPin, Globe } from "lucide-react";
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

  // War Hero: top fame participant in current race
  const raceParticipants: { tag: string; name: string; fame: number }[] =
    race?.clan?.tag === CLAN_TAG
      ? race.clan.participants ?? []
      : race?.clans?.find((c: { tag: string }) => c.tag === CLAN_TAG)?.participants ?? [];

  const topFameParticipant = raceParticipants
    .filter((p) => p.fame > 0)
    .sort((a, b) => b.fame - a.fame)[0] ?? null;

  const warHero = topFameParticipant
    ? { name: topFameParticipant.name, fame: topFameParticipant.fame }
    : null;

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
