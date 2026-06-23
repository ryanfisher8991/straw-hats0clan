"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trophy, Anchor, Swords } from "lucide-react";

const CLAN_TAG = "#QPRQ88YP";

interface Participant {
  tag: string;
  name: string;
  fame: number;
  repairPoints: number;
  boatAttacks: number;
  decksUsed: number;
  decksUsedToday: number;
}

interface StandingClan {
  tag: string;
  name: string;
  fame: number;
  repairPoints: number;
  finishTime?: string;
  participants: Participant[];
  clanScore?: number;
}

interface Standing {
  rank: number;
  trophyChange: number;
  clan: StandingClan;
}

interface RaceItem {
  seasonId: number;
  sectionIndex: number;
  createdDate: string;
  standings: Standing[];
}

const POSITION_STYLES: Record<number, { label: string; class: string }> = {
  1: { label: "1st", class: "text-gold-400 bg-gold-700/30 border-gold-700" },
  2: { label: "2nd", class: "text-text-secondary bg-navy-600/40 border-navy-500" },
  3: { label: "3rd", class: "text-amber-600 bg-amber-900/20 border-amber-900" },
};

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const y = dateStr.slice(0, 4), m = dateStr.slice(4, 6), d = dateStr.slice(6, 8);
  return `${m}/${d}/${y}`;
}

function getOurEntry(item: RaceItem): Standing | undefined {
  return item.standings?.find(s => s.clan?.tag === CLAN_TAG);
}

export default function WarLogClient({ races }: { races: RaceItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!races.length) {
    return (
      <div className="card-base p-12 flex items-center justify-center">
        <p className="font-heading text-text-muted tracking-wider text-sm">No war history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {races.map((race, i) => {
        const key = `${race.seasonId}-${race.sectionIndex}`;
        const isOpen = expanded === key;
        const ourEntry = getOurEntry(race);
        const ourClan = ourEntry?.clan;
        const pos = ourEntry?.rank ?? null;
        const posStyle = pos ? POSITION_STYLES[pos] : null;
        const participants = ourClan?.participants ?? [];
        const sortedParticipants = [...participants].sort((a, b) => b.fame - a.fame);
        const activeCount = participants.filter(p => p.fame > 0).length;
        // clan.fame from API is unreliable — always sum participants directly
        const totalFame = participants.reduce((s, p) => s + p.fame, 0);

        return (
          <div
            key={key}
            className="card-base overflow-hidden"
            style={{ opacity: 0, animation: `fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s forwards` }}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : key)}
              className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-white/[0.02] transition-colors text-left"
            >
              {/* Position badge */}
              <div className={`shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center font-display text-sm ${posStyle?.class ?? "text-text-muted bg-navy-700/40 border-navy-600"}`}>
                {posStyle?.label ?? (pos ? `${pos}th` : "—")}
              </div>

              {/* Race info */}
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm tracking-wide text-text-primary">{formatDate(race.createdDate ?? "")}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <p className="font-display text-base text-gold-gradient">{totalFame.toLocaleString()}</p>
                  <p className="font-heading text-[0.6rem] tracking-wider text-text-muted uppercase">Fame</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-base text-text-primary">{activeCount}</p>
                  <p className="font-heading text-[0.6rem] tracking-wider text-text-muted uppercase">Active</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-base text-text-primary">{participants.length}</p>
                  <p className="font-heading text-[0.6rem] tracking-wider text-text-muted uppercase">Total</p>
                </div>
              </div>

              {/* Mobile */}
              <div className="sm:hidden shrink-0 text-right">
                <p className="font-display text-sm text-gold-gradient">{totalFame.toLocaleString()}</p>
                <p className="text-[0.6rem] text-text-muted font-heading tracking-wider">Fame</p>
              </div>

              <div className="shrink-0 text-text-muted ml-1">
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {/* Expanded member breakdown */}
            {isOpen && (
              <div className="border-t border-navy-500 px-4 sm:px-5 pb-4 pt-3">
                <div className="flex items-center gap-4 mb-3 text-[0.6rem] font-heading tracking-[0.15em] text-text-muted uppercase">
                  <span className="w-6" />
                  <span className="flex-1">Player</span>
                  <span className="w-16 text-right"><Trophy size={10} className="inline mr-1" />Fame</span>
                  <span className="hidden sm:block w-16 text-right"><Anchor size={10} className="inline mr-1" />Boats</span>
                  <span className="hidden sm:block w-16 text-right"><Swords size={10} className="inline mr-1" />Decks</span>
                </div>
                <div className="space-y-1">
                  {sortedParticipants.map((p, idx) => (
                    <div
                      key={p.tag}
                      className={`flex items-center gap-4 py-2 px-3 rounded-lg ${p.fame > 0 ? "bg-navy-800 border border-navy-500" : "opacity-40"}`}
                    >
                      <span className="font-display text-xs text-text-muted w-6 text-center">{idx + 1}</span>
                      <span className="flex-1 font-body text-sm text-text-primary truncate">{p.name}</span>
                      <span className={`w-16 text-right font-heading text-xs ${p.fame > 0 ? "text-gold-400" : "text-text-muted"}`}>
                        {p.fame > 0 ? p.fame.toLocaleString() : "—"}
                      </span>
                      <span className="hidden sm:block w-16 text-right font-heading text-xs text-text-secondary">{p.boatAttacks}</span>
                      <span className="hidden sm:block w-16 text-right font-heading text-xs text-text-secondary">{p.decksUsed}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
