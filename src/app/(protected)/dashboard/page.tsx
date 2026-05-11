import { getClan, getClanMembers, getClanLocalRank } from "@/lib/cr-api";
import { Trophy, Users, Swords, Heart, Crown, MapPin, Globe } from "lucide-react";
import type { ClanMember } from "@/types/clash";

export const revalidate = 300;

async function getData() {
  try {
    const [clan, membersRes, localRank] = await Promise.allSettled([
      getClan(),
      getClanMembers(),
      getClanLocalRank(),
    ]);
    return {
      clan: clan.status === "fulfilled" ? clan.value : null,
      members: membersRes.status === "fulfilled" ? membersRes.value?.items ?? [] : [],
      localRank: localRank.status === "fulfilled" ? localRank.value : null,
    };
  } catch {
    return { clan: null, members: [], localRank: null };
  }
}

export default async function DashboardPage() {
  const { clan, members, localRank } = await getData();

  const topDonors: ClanMember[] = [...members]
    .sort((a: ClanMember, b: ClanMember) => b.donations - a.donations)
    .slice(0, 5);

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
