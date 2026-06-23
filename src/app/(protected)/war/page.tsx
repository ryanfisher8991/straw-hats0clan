import { getRiverRaceLog, getCurrentRiverRace, getClanMembers, getMembersByTag } from "@/lib/cr-api";
import { Swords, TrendingUp, Users, Trophy } from "lucide-react";
import WarLogClient from "./WarLogClient";
import SyncButton from "./SyncButton";
import RacePanel from "../dashboard/RacePanel";

const CLAN_TAG = "#QPRQ88YP";

export const revalidate = 300;

async function getData() {
  const [logRes, currentRes, membersRes] = await Promise.allSettled([
    getRiverRaceLog(),
    getCurrentRiverRace(),
    getClanMembers(),
  ]);
  return {
    log: logRes.status === "fulfilled" ? logRes.value?.items ?? [] : [],
    current: currentRes.status === "fulfilled" ? currentRes.value : null,
    members: membersRes.status === "fulfilled" ? membersRes.value?.items ?? [] : [],
  };
}

export default async function WarPage() {
  const { log, current, members } = await getData();

  // Current race: clan is at top level in currentriverrace endpoint
  const ourClan = current?.clan;
  const totalFame = ourClan?.participants?.reduce((s: number, p: { fame: number }) => s + p.fame, 0) ?? 0;
  const activeCount = ourClan?.participants?.filter((p: { fame: number }) => p.fame > 0).length ?? 0;

  // Build clan standings — include full participants for opponent drill-down
  const racingClans = (current?.clans ?? []).map((c: { tag: string; name: string; fame: number; participants?: { tag: string; name: string; fame: number; decksUsed: number; decksUsedToday: number; boatAttacks?: number }[] }) => ({
    tag: c.tag,
    name: c.name,
    fame: c.tag === CLAN_TAG ? totalFame : (c.participants ?? []).reduce((s: number, p: { fame: number }) => s + p.fame, 0),
    participants: c.tag === CLAN_TAG ? (ourClan?.participants ?? []) : (c.participants ?? []),
  }));

  // Fetch current member lists for all opponent clans so we can hide ex-members
  const ourMemberTags = members.map((m: { tag: string }) => m.tag);
  const clanMemberTags: Record<string, string[]> = { [CLAN_TAG]: ourMemberTags };

  if (current?.clans) {
    const opponentTags = (current.clans as { tag: string }[])
      .map(c => c.tag)
      .filter(t => t !== CLAN_TAG);

    const opponentResults = await Promise.allSettled(
      opponentTags.map(tag => getMembersByTag(tag))
    );

    opponentTags.forEach((tag, i) => {
      const res = opponentResults[i];
      if (res.status === "fulfilled") {
        clanMemberTags[tag] = (res.value?.items ?? []).map((m: { tag: string }) => m.tag);
      }
    });
  }

  const allRaces = log ?? [];

  // standings[] holds all clans; find ours by tag in each race
  const totalWins = allRaces.filter((r: { standings?: { rank: number; clan: { tag: string } }[] }) => {
    const entry = r.standings?.find((s) => s.clan?.tag === CLAN_TAG);
    return entry?.rank === 1;
  }).length;

  const avgFame =
    allRaces.length > 0
      ? Math.round(
          allRaces.reduce((s: number, r: { standings?: { clan: { tag: string; participants?: { fame: number }[] } }[] }) => {
            const entry = r.standings?.find((st) => st.clan?.tag === CLAN_TAG);
            const raceFame = (entry?.clan?.participants ?? []).reduce((ps, p) => ps + p.fame, 0);
            return s + raceFame;
          }, 0) / allRaces.length
        )
      : 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 animate-fade-up flex items-start justify-between gap-4 flex-wrap" style={{ opacity: 0, animationDelay: "0.05s" }}>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-gold-gradient mb-1">War Log</h1>
          <p className="text-text-muted text-sm font-body">River race history · {allRaces.length} races in API · save to Supabase to build full history</p>
        </div>
        <SyncButton />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Races Logged", value: allRaces.length, icon: Swords, color: "text-gold-400" },
          { label: "Wars Won", value: totalWins, icon: Trophy, color: "text-red-clash" },
          { label: "Avg Fame", value: avgFame.toLocaleString(), icon: TrendingUp, color: "text-blue-clash" },
          { label: "Current Active", value: activeCount, icon: Users, color: "text-green-clash" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <div
            key={label}
            className="card-base stat-card-glow p-5 animate-fade-up"
            style={{ opacity: 0, animationDelay: `${0.1 + i * 0.05}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="font-heading text-[0.65rem] tracking-[0.15em] text-text-muted uppercase">{label}</p>
              <Icon size={16} className={color} strokeWidth={1.5} />
            </div>
            <p className="font-display text-2xl text-gold-gradient">{value}</p>
          </div>
        ))}
      </div>

      {/* Current race — expandable panel */}
      {ourClan && current && (
        <div className="mb-6">
          <RacePanel
            seasonId={current.seasonId}
            sectionIndex={current.sectionIndex}
            totalFame={totalFame}
            participants={ourClan.participants ?? []}
            members={members.map((m: { tag: string; name: string }) => ({ tag: m.tag, name: m.name }))}
            clans={racingClans}
            clanMemberTags={clanMemberTags}
          />
        </div>
      )}

      {/* Race history */}
      <div className="mb-4">
        <h2 className="font-heading text-xs tracking-[0.2em] text-text-muted uppercase mb-4">
          Past Races — Click to Expand
        </h2>
        <WarLogClient races={allRaces} />
      </div>
    </div>
  );
}
