import { supabase } from "@/lib/supabase";
import { getClanMembers } from "@/lib/cr-api";
import { BarChart2, AlertTriangle, Trophy, Swords } from "lucide-react";
import WarAnalysisClient, { MemberAnalysis, WarEntry } from "./WarAnalysisClient";

export const revalidate = 300;

async function getAnalysisData(): Promise<{ members: MemberAnalysis[]; snapshotCount: number }> {
  try {
    const [snapshotsRes, clanMembersRes] = await Promise.allSettled([
      supabase
        .from("war_snapshots")
        .select("id, season_id, section_index, snapshotted_at")
        .order("snapshotted_at", { ascending: false })
        .limit(10),
      getClanMembers(),
    ]);

    const snapshots =
      snapshotsRes.status === "fulfilled" ? snapshotsRes.value.data ?? [] : [];
    const clanMemberItems =
      clanMembersRes.status === "fulfilled" ? clanMembersRes.value?.items ?? [] : [];

    // Build a map of tag → clanRank for current members only
    const currentMemberRanks = new Map<string, number>(
      clanMemberItems.map((m: { tag: string; clanRank: number }) => [m.tag, m.clanRank])
    );
    const currentMemberTags = new Set(currentMemberRanks.keys());

    if (!snapshots.length) return { members: [], snapshotCount: 0 };

    const snapshotIds = snapshots.map((s) => s.id);

    const { data: stats, error: statsErr } = await supabase
      .from("war_member_stats")
      .select("snapshot_id, player_tag, player_name, fame, decks_used")
      .in("snapshot_id", snapshotIds);

    if (statsErr || !stats?.length) return { members: [], snapshotCount: snapshots.length };

    const snapshotMap = new Map(
      snapshots
        .map((s) => ({
          key: s.id,
          val: { seasonId: s.season_id, sectionIndex: s.section_index, date: s.snapshotted_at },
        }))
        .map(({ key, val }) => [key, val])
    );

    const memberMap = new Map<string, { tag: string; name: string; wars: WarEntry[] }>();

    for (const stat of stats) {
      // Skip players no longer in the clan
      if (!currentMemberTags.has(stat.player_tag)) continue;

      const snap = snapshotMap.get(stat.snapshot_id);
      if (!snap) continue;

      if (!memberMap.has(stat.player_tag)) {
        memberMap.set(stat.player_tag, { tag: stat.player_tag, name: stat.player_name, wars: [] });
      }

      memberMap.get(stat.player_tag)!.wars.push({
        snapshotId: stat.snapshot_id,
        seasonId: snap.seasonId,
        sectionIndex: snap.sectionIndex,
        date: snap.date,
        fame: stat.fame,
        decksUsed: stat.decks_used,
        decksMissed: Math.max(0, 16 - stat.decks_used),
      });
    }

    const members: MemberAnalysis[] = Array.from(memberMap.values())
      .map((member) => {
        const wars = [...member.wars].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Any war with 0 decks used means they weren't actually around to
        // battle that week — joined late, left early, or were out of the
        // clan entirely but still appear in that war's participant list.
        // Exclude those from the averages (still shown in their history).
        for (const w of wars) {
          if (w.decksUsed === 0) w.excludedFromAverage = true;
        }

        const countedWars = wars.filter((w) => !w.excludedFromAverage);
        const avgFame = countedWars.length
          ? Math.round(countedWars.reduce((s, w) => s + w.fame, 0) / countedWars.length)
          : 0;
        const avgDecksMissed = countedWars.length
          ? Math.round((countedWars.reduce((s, w) => s + w.decksMissed, 0) / countedWars.length) * 10) / 10
          : 0;
        return {
          tag: member.tag,
          name: member.name,
          wars,
          avgFame,
          avgDecksMissed,
          warsCount: countedWars.length,
          clanRank: currentMemberRanks.get(member.tag) ?? null,
        };
      })
      .sort((a, b) => b.avgFame - a.avgFame);

    return { members, snapshotCount: snapshots.length };
  } catch {
    return { members: [], snapshotCount: 0 };
  }
}

export default async function WarAnalysisPage() {
  const { members, snapshotCount } = await getAnalysisData();

  const flaggedCount = members.filter((m) => m.avgFame < 1700).length;
  const topAvgFame = members.length > 0 ? members[0].avgFame : 0;
  const overallAvg =
    members.length > 0
      ? Math.round(members.reduce((s, m) => s + m.avgFame, 0) / members.length)
      : 0;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div
        className="mb-8 animate-fade-up"
        style={{ opacity: 0, animationDelay: "0.05s" }}
      >
        <div className="flex items-start gap-3 mb-1">
          <BarChart2 size={22} className="text-gold-400 mt-1 shrink-0" strokeWidth={1.5} />
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-gold-gradient">
              War Analysis
            </h1>
            <p className="text-text-muted text-sm font-body mt-0.5">
              Current members only · completed wars ·{" "}
              {snapshotCount > 0
                ? `last ${snapshotCount} war${snapshotCount !== 1 ? "s" : ""} from Supabase`
                : "no snapshots yet — sync from War Log first"}
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {members.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Members Tracked",
              value: members.length,
              icon: Swords,
              color: "text-gold-400",
            },
            {
              label: "Flagged",
              value: flaggedCount,
              icon: AlertTriangle,
              color: flaggedCount > 0 ? "text-red-clash" : "text-green-clash",
            },
            {
              label: "Clan Avg Fame",
              value: overallAvg.toLocaleString(),
              icon: Trophy,
              color: overallAvg >= 1700 ? "text-green-clash" : "text-red-clash",
            },
            {
              label: "Top Avg Fame",
              value: topAvgFame.toLocaleString(),
              icon: Trophy,
              color: "text-gold-400",
            },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <div
              key={label}
              className="card-base stat-card-glow p-5 animate-fade-up"
              style={{ opacity: 0, animationDelay: `${0.1 + i * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="font-heading text-[0.63rem] tracking-[0.14em] text-text-muted uppercase">
                  {label}
                </p>
                <Icon size={15} className={color} strokeWidth={1.5} />
              </div>
              <p className={`font-display text-2xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main table */}
      <div
        className="animate-fade-up"
        style={{ opacity: 0, animationDelay: "0.3s" }}
      >
        <WarAnalysisClient members={members} snapshotCount={snapshotCount} />
      </div>
    </div>
  );
}
