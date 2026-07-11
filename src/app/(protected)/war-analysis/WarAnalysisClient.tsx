"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trophy, Swords, AlertTriangle, TrendingDown, Shield } from "lucide-react";

export interface WarEntry {
  snapshotId: string;
  seasonId: number;
  sectionIndex: number;
  date: string;
  fame: number;
  decksUsed: number;
  decksMissed: number;
  excludedFromAverage?: boolean;
}

export interface MemberAnalysis {
  tag: string;
  name: string;
  wars: WarEntry[];
  avgFame: number;
  avgDecksMissed: number;
  warsCount: number;
  clanRank: number | null;
}

const FAME_WEEKLY_THRESHOLD = 1700;
const FAME_WAR_THRESHOLD = 850;

const AVG_FAME_RANKS = [
  { name: "Clash God",       min: 3400, color: "#ff9500", border: "border-[#ff9500]/40", bg: "bg-[#ff9500]/10" },
  { name: "First Moon",      min: 3200, color: "#e2e8f0", border: "border-slate-300/40",  bg: "bg-slate-700/20"  },
  { name: "Monarch",         min: 3000, color: "#c084fc", border: "border-purple-500/40", bg: "bg-purple-900/15" },
  { name: "Wizard King",     min: 2800, color: "#22d3ee", border: "border-cyan-500/40",   bg: "bg-cyan-900/15"   },
  { name: "Titan",           min: 2600, color: "#fb923c", border: "border-orange-500/40", bg: "bg-orange-900/15" },
  { name: "Hero",            min: 2400, color: "#4ade80", border: "border-green-500/40",  bg: "bg-green-900/15"  },
  { name: "Soul Reaper",     min: 2200, color: "#60a5fa", border: "border-blue-500/40",   bg: "bg-blue-900/15"   },
  { name: "Hunter",          min: 2000, color: "#fbbf24", border: "border-amber-500/40",  bg: "bg-amber-900/15"  },
  { name: "State Alchemist", min: 1800, color: "#f87171", border: "border-red-500/40",    bg: "bg-red-900/15"    },
  { name: "Genin",           min: 1200, color: "#94a3b8", border: "border-slate-500/40",  bg: "bg-slate-800/20"  },
  { name: "Ghoul",           min: 0,    color: "#617090", border: "border-navy-400/40",   bg: "bg-navy-700/20"   },
];

function getAvgFameRank(avgFame: number) {
  return AVG_FAME_RANKS.find(r => avgFame >= r.min) ?? AVG_FAME_RANKS[AVG_FAME_RANKS.length - 1];
}

function AvgFameRankBadge({ avgFame }: { avgFame: number }) {
  const rank = getAvgFameRank(avgFame);
  return (
    <span
      className={`font-heading text-[0.5rem] tracking-wider uppercase px-1.5 py-0.5 rounded border ${rank.border} ${rank.bg} shrink-0`}
      style={{ color: rank.color }}
    >
      {rank.name}
    </span>
  );
}

function FameBar({ value, max = 2400 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color =
    value < FAME_WEEKLY_THRESHOLD
      ? "from-red-clash to-red-light"
      : value >= 2000
      ? "from-green-clash to-emerald-400"
      : "from-gold-600 to-gold-400";
  return (
    <div className="w-full h-1 bg-navy-500 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function WarRow({ war }: { war: WarEntry }) {
  const isExcluded = war.excludedFromAverage;
  const isFlashing = !isExcluded && war.fame < FAME_WAR_THRESHOLD;
  const d = new Date(war.date);
  const dateLabel = `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}/${d.getUTCFullYear()}`;

  return (
    <div
      className={`grid grid-cols-[6rem_1fr_4rem_5rem] sm:grid-cols-[8rem_1fr_5rem_6rem] items-center gap-2 py-2 px-3 rounded-lg border ${
        isExcluded
          ? "border-navy-500 opacity-50"
          : isFlashing
          ? "border-red-clash/40 animate-flash-red-bg"
          : "bg-navy-800 border-navy-500"
      }`}
    >
      <span className="font-heading text-[0.65rem] tracking-wide text-text-muted">
        {dateLabel}
      </span>

      {isExcluded ? (
        <span className="font-heading text-[0.65rem] tracking-wide text-text-muted italic">
          Joined too late to battle — excluded from average
        </span>
      ) : (
        <span
          className={`font-display text-sm text-right sm:text-left ${
            isFlashing
              ? "animate-flash-red"
              : war.fame >= FAME_WEEKLY_THRESHOLD
              ? "text-green-clash"
              : "text-gold-400"
          }`}
        >
          {war.fame.toLocaleString()}
          {isFlashing && (
            <AlertTriangle size={10} className="inline ml-1 animate-flash-red" />
          )}
        </span>
      )}

      <span className={`font-heading text-xs text-right ${!isExcluded && war.decksMissed > 0 ? "text-red-clash" : "text-text-secondary"}`}>
        {war.decksUsed} of 16
      </span>

      <span
        className={`font-heading text-xs text-right ${
          !isExcluded && war.decksMissed > 0 ? "text-red-clash" : "text-text-muted"
        }`}
      >
        {isExcluded ? "—" : war.decksMissed > 0 ? `${war.decksMissed} missed` : "—"}
      </span>
    </div>
  );
}

export default function WarAnalysisClient({
  members,
  snapshotCount,
}: {
  members: MemberAnalysis[];
  snapshotCount: number;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!members.length) {
    return (
      <div className="card-base p-16 flex flex-col items-center justify-center gap-4">
        <Swords size={32} className="text-text-muted" strokeWidth={1} />
        <p className="font-heading text-text-muted tracking-wider text-sm text-center">
          No war history in Supabase yet.
        </p>
        <p className="font-body text-text-muted/60 text-xs text-center max-w-sm">
          Go to War Log and click{" "}
          <span className="text-gold-400">Sync Snapshots</span> to save wars
          to the database. Analysis only uses completed wars.
        </p>
      </div>
    );
  }

  const flaggedCount = members.filter((m) => m.avgFame < FAME_WEEKLY_THRESHOLD).length;

  return (
    <div className="space-y-2">
      {/* Legend / threshold info */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-[0.65rem] font-heading tracking-[0.12em] text-text-muted uppercase">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-clash inline-block" />
          Avg fame &lt; {FAME_WEEKLY_THRESHOLD.toLocaleString()}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-clash inline-block animate-flash-red" />
          Single war &lt; {FAME_WAR_THRESHOLD.toLocaleString()} (flashes)
        </span>
        {flaggedCount > 0 && (
          <span className="ml-auto text-red-clash flex items-center gap-1">
            <AlertTriangle size={11} />
            {flaggedCount} member{flaggedCount > 1 ? "s" : ""} flagged
          </span>
        )}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_5rem_1.5rem] sm:grid-cols-[1fr_8rem_7rem_5rem_1.5rem] items-center gap-2 px-4 py-1.5 text-[0.58rem] font-heading tracking-[0.14em] text-text-muted uppercase">
        <span>Member</span>
        <span className="text-right">Avg Fame</span>
        <span className="text-right hidden sm:block">Decks Used</span>
        <span className="text-right hidden sm:block">Wars</span>
        <span />
      </div>

      {members.map((member, i) => {
        const isOpen = expanded === member.tag;
        const isFlagged = member.avgFame < FAME_WEEKLY_THRESHOLD;
        const mostRecentFame = member.wars[0]?.fame ?? null;
        const isFlaggedRecent = mostRecentFame !== null && mostRecentFame < FAME_WEEKLY_THRESHOLD;
        const totalDecksUsed = member.wars.reduce((s, w) => s + w.decksUsed, 0);
        const maxDecks = member.warsCount * 16;
        const avgDecksUsed = Math.round((totalDecksUsed / member.warsCount) * 10) / 10;

        return (
          <div
            key={member.tag}
            className={`card-base overflow-hidden transition-shadow duration-200 ${
              isFlagged ? "border-red-clash/40 shadow-[0_0_0_1px_rgba(224,48,48,0.15)]" : ""
            }`}
            style={{
              opacity: 0,
              animation: `fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.025}s forwards`,
            }}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : member.tag)}
              className={`w-full grid grid-cols-[1fr_5rem_1.5rem] sm:grid-cols-[1fr_8rem_7rem_5rem_1.5rem] items-center gap-2 px-4 py-3.5 hover:bg-white/[0.025] transition-colors text-left ${
                isFlaggedRecent ? "animate-flash-red-bg" : isFlagged ? "bg-red-clash/[0.04]" : ""
              }`}
            >
              {/* Name */}
              <div className="flex items-center gap-2 min-w-0">
                {isFlagged ? (
                  <AlertTriangle size={12} className="text-red-clash shrink-0" />
                ) : (
                  <Shield size={12} className="text-text-muted/40 shrink-0" />
                )}
                {member.clanRank != null && (
                  <span className="font-heading text-[0.6rem] tracking-wide text-text-muted shrink-0">
                    #{member.clanRank}
                  </span>
                )}
                <span
                  className={`font-heading text-sm tracking-wide truncate ${
                    isFlagged ? "text-red-clash" : "text-text-primary"
                  }`}
                >
                  {member.name}
                </span>
                <AvgFameRankBadge avgFame={member.avgFame} />
              </div>

              {/* Avg Fame */}
              <div className="text-right">
                <span
                  className={`font-display text-sm ${
                    isFlagged ? "text-red-clash" : "text-gold-gradient"
                  }`}
                >
                  {member.avgFame.toLocaleString()}
                </span>
              </div>

              {/* Decks Used total — desktop only */}
              <div className="text-right hidden sm:block">
                <span
                  className={`font-heading text-xs ${
                    totalDecksUsed < maxDecks
                      ? totalDecksUsed < maxDecks * 0.75
                        ? "text-red-clash"
                        : "text-gold-400"
                      : "text-green-clash"
                  }`}
                >
                  {totalDecksUsed} of {maxDecks}
                </span>
              </div>

              {/* Wars count — desktop only */}
              <div className="text-right hidden sm:block">
                <span className="font-heading text-xs text-text-muted">
                  {member.warsCount}
                </span>
              </div>

              <div className="flex justify-center text-text-muted">
                {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </div>
            </button>

            {/* Fame bar */}
            <div className="px-4 pb-2.5 -mt-1">
              <FameBar value={member.avgFame} />
            </div>

            {/* Expanded per-war breakdown */}
            {isOpen && (
              <div className="border-t border-navy-500 px-4 pb-4 pt-3">
                <div className="grid grid-cols-[6rem_1fr_4rem_5rem] sm:grid-cols-[8rem_1fr_5rem_6rem] items-center gap-2 mb-2 text-[0.58rem] font-heading tracking-[0.14em] text-text-muted uppercase px-3">
                  <span>War</span>
                  <span className="text-right sm:text-left">Fame</span>
                  <span className="text-right">Decks</span>
                  <span className="text-right">Missed</span>
                </div>
                <div className="space-y-1">
                  {member.wars.map((war) => (
                    <WarRow key={war.snapshotId} war={war} />
                  ))}
                </div>
                {/* Mobile: show decks used total */}
                <div className="sm:hidden mt-3 flex items-center justify-between px-3 text-[0.65rem] font-heading tracking-wide text-text-muted">
                  <span>Total Decks Used</span>
                  <span
                    className={
                      totalDecksUsed < maxDecks
                        ? totalDecksUsed < maxDecks * 0.75
                          ? "text-red-clash"
                          : "text-gold-400"
                        : "text-green-clash"
                    }
                  >
                    {totalDecksUsed} of {maxDecks}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
