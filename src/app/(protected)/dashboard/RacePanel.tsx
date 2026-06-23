"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Swords, AlertCircle, TrendingUp, Shield, X } from "lucide-react";

interface Participant {
  tag: string;
  name: string;
  fame: number;
  decksUsed: number;
  decksUsedToday: number;
  boatAttacks?: number;
}

interface Member {
  tag: string;
  name: string;
}

interface RaceClan {
  tag: string;
  name: string;
  fame: number;
  participants?: Participant[];
}

interface Props {
  seasonId: number;
  sectionIndex: number;
  totalFame: number;
  participants: Participant[];
  members: Member[];
  clans?: RaceClan[];
  ourTag?: string;
  clanMemberTags?: Record<string, string[]>;
}

const CLAN_TAG = "#QPRQ88YP";
const DECKS_PER_DAY = 4;

const RANK_STYLES: Record<number, string> = {
  1: "text-gold-400 border-gold-700/60 bg-gold-700/20",
  2: "text-text-secondary border-navy-500 bg-navy-700/40",
  3: "text-amber-500 border-amber-900/60 bg-amber-900/20",
};

function rankLabel(n: number) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function decksLeftToday(p: Participant) {
  return Math.max(0, DECKS_PER_DAY - p.decksUsedToday);
}

function DeckPips({ left }: { left: number }) {
  return (
    <div className="flex gap-0.5 shrink-0">
      {Array.from({ length: DECKS_PER_DAY }).map((_, i) => (
        <div key={i} className={`w-2 h-3 rounded-sm ${i < left ? "bg-blue-clash" : "bg-navy-600"}`} />
      ))}
    </div>
  );
}

function ParticipantRow({ p }: { p: Participant }) {
  const left = decksLeftToday(p);
  const dim = p.fame === 0 && p.decksUsed === 0 ? "opacity-40" : p.fame === 0 ? "opacity-60" : "";
  return (
    <div className={`flex items-center gap-2 py-2 px-3 rounded-lg bg-navy-800/60 border border-navy-600/40 ${dim}`}>
      <span className="flex-1 font-body text-sm text-text-primary truncate">{p.name}</span>
      <div className="flex items-center gap-1 w-20 justify-end">
        <TrendingUp size={10} className="text-gold-500 shrink-0" strokeWidth={1.5} />
        <span className="font-heading text-xs text-gold-400">
          {p.fame > 0 ? p.fame.toLocaleString() : <span className="text-navy-400">—</span>}
        </span>
      </div>
      <div className="flex items-center gap-1 w-16 justify-end">
        <Swords size={10} className="text-text-muted shrink-0" strokeWidth={1.5} />
        <span className="font-heading text-[0.65rem] text-text-muted">{p.decksUsed} used</span>
      </div>
      <DeckPips left={left} />
      <span className="font-heading text-[0.6rem] text-blue-clash w-10 text-right shrink-0">
        {left > 0 ? `${left} left` : <span className="text-navy-500">done</span>}
      </span>
    </div>
  );
}

function ClanDetail({ clan, currentMemberTags, onClose }: { clan: RaceClan; currentMemberTags?: Set<string>; onClose: () => void }) {
  const all = clan.participants ?? [];
  const currentSet = currentMemberTags;

  // Current members only (or all if we don't know)
  const current = currentSet
    ? all.filter(p => currentSet.has(p.tag))
    : all;

  // Ex-members who scored fame — gray at bottom
  const exWithFame = currentSet
    ? all.filter(p => !currentSet.has(p.tag) && p.fame > 0)
    : [];

  const sorted = [...current].sort((a, b) => {
    if (a.fame === 0 && b.fame === 0) return b.decksUsed - a.decksUsed;
    return b.fame - a.fame;
  });
  const sortedEx = [...exWithFame].sort((a, b) => b.fame - a.fame);

  const activeCount = current.filter(p => p.fame > 0).length;
  const notBattled = current.filter(p => p.fame === 0 && p.decksUsed === 0).length;

  return (
    <div className="mt-3 rounded-xl border border-navy-500 bg-navy-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-600/60">
        <div>
          <p className="font-heading text-xs tracking-wider text-text-primary">{clan.name}</p>
          <p className="font-heading text-[0.6rem] text-text-muted mt-0.5">
            {activeCount} fighting · {notBattled} haven&apos;t battled · {current.length} members
            {sortedEx.length > 0 && <span className="text-text-muted/50"> · {sortedEx.length} left clan</span>}
          </p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1">
          <X size={14} />
        </button>
      </div>
      <div className="px-3 py-3 space-y-1 max-h-72 overflow-y-auto">
        {sorted.map(p => <ParticipantRow key={p.tag} p={p} />)}
        {sortedEx.length > 0 && (
          <>
            <p className="font-heading text-[0.55rem] tracking-[0.15em] text-text-muted/50 uppercase pt-2 px-1">Left clan</p>
            {sortedEx.map(p => (
              <div key={p.tag} className="opacity-40">
                <ParticipantRow p={p} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function RacePanel({ seasonId, sectionIndex, totalFame, participants, members, clans, ourTag = CLAN_TAG, clanMemberTags }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [openClanTag, setOpenClanTag] = useState<string | null>(null);

  const currentMemberTagSet = new Set(members.map(m => m.tag));

  // Split our participants: current members vs ex-members
  const currentParticipants = participants.filter(p => currentMemberTagSet.has(p.tag));
  const exParticipantsWithFame = participants.filter(p => !currentMemberTagSet.has(p.tag) && p.fame > 0);

  const participantMap = new Map(currentParticipants.map(p => [p.tag, p]));
  const notParticipating = members.filter(m => !participantMap.has(m.tag));

  const sorted = [...currentParticipants].sort((a, b) => {
    if (a.fame === 0 && b.fame === 0) return b.decksUsed - a.decksUsed;
    return b.fame - a.fame;
  });
  const sortedEx = [...exParticipantsWithFame].sort((a, b) => b.fame - a.fame);

  const activeCount = currentParticipants.filter(p => p.fame > 0).length;
  const idleCount = currentParticipants.filter(p => p.fame === 0 && p.decksUsed === 0).length;
  const notInCount = notParticipating.length;

  const sortedClans = clans ? [...clans].sort((a, b) => b.fame - a.fame) : [];
  const ourRank = sortedClans.findIndex(c => c.tag === ourTag) + 1;

  function toggleClan(tag: string) {
    setOpenClanTag(prev => prev === tag ? null : tag);
  }

  return (
    <div className="card-base animate-fade-up" style={{ opacity: 0, animationDelay: "0.4s" }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full p-6 text-left flex items-start justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-clash animate-pulse shrink-0" />
            <h2 className="font-heading text-sm tracking-wider text-text-primary">Current River Race</h2>
            <span className="font-heading text-[0.6rem] tracking-wider text-green-clash uppercase">Live</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-navy-800 rounded-full px-3 py-1 border border-navy-600">
              <TrendingUp size={11} className="text-gold-400" strokeWidth={1.5} />
              <span className="font-display text-sm text-gold-gradient">{totalFame.toLocaleString()}</span>
              <span className="font-heading text-[0.55rem] text-text-muted uppercase">fame</span>
            </div>
            {ourRank > 0 && (
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 border ${RANK_STYLES[ourRank] ?? "text-text-muted border-navy-600 bg-navy-800"}`}>
                <Shield size={11} strokeWidth={1.5} />
                <span className="font-heading text-xs">{rankLabel(ourRank)} place</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-navy-800 rounded-full px-3 py-1 border border-navy-600">
              <Swords size={11} className="text-green-clash" strokeWidth={1.5} />
              <span className="font-heading text-xs text-green-clash">{activeCount} fighting</span>
            </div>
            {(idleCount + notInCount) > 0 && (
              <div className="flex items-center gap-1.5 bg-red-clash/10 rounded-full px-3 py-1 border border-red-clash/30">
                <AlertCircle size={11} className="text-red-clash" strokeWidth={1.5} />
                <span className="font-heading text-xs text-red-clash">{idleCount + notInCount} haven&apos;t battled</span>
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0 mt-1 text-text-muted">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-navy-600/50">

          {/* Clan standings */}
          {sortedClans.length > 0 && (
            <div className="mt-4 mb-5">
              <p className="font-heading text-[0.6rem] tracking-[0.15em] text-text-muted uppercase mb-3">
                Clan Standings — click opponent to see their roster
              </p>
              <div className="space-y-1.5">
                {sortedClans.map((clan, i) => {
                  const rank = i + 1;
                  const isOurs = clan.tag === ourTag;
                  const isOpen = openClanTag === clan.tag;
                  const rankStyle = RANK_STYLES[rank] ?? "text-text-muted border-navy-600 bg-navy-700/20";
                  const hasParticipants = (clan.participants ?? []).length > 0;

                  return (
                    <div key={clan.tag}>
                      <div
                        onClick={() => !isOurs && hasParticipants && toggleClan(clan.tag)}
                        className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border transition-colors ${
                          isOurs
                            ? "bg-blue-clash/10 border-blue-clash/40"
                            : hasParticipants
                              ? "bg-navy-800/60 border-navy-600/40 cursor-pointer hover:bg-navy-700/60 hover:border-navy-500"
                              : "bg-navy-800/60 border-navy-600/40"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-md border flex items-center justify-center font-display text-xs shrink-0 ${rankStyle}`}>
                          {rank}
                        </div>
                        <span className={`flex-1 font-body text-sm truncate ${isOurs ? "text-blue-clash font-semibold" : "text-text-primary"}`}>
                          {clan.name}
                          {isOurs && <span className="font-heading text-[0.55rem] text-blue-clash/70 ml-1.5 uppercase tracking-wider">us</span>}
                        </span>
                        <div className="flex items-center gap-1">
                          <TrendingUp size={10} className="text-gold-500 shrink-0" strokeWidth={1.5} />
                          <span className="font-heading text-xs text-gold-400">{clan.fame.toLocaleString()}</span>
                        </div>
                        {i > 0 ? (
                          <span className="font-heading text-[0.6rem] text-text-muted w-16 text-right shrink-0">
                            -{(sortedClans[0].fame - clan.fame).toLocaleString()}
                          </span>
                        ) : (
                          <span className="font-heading text-[0.6rem] text-gold-500 w-16 text-right shrink-0">leader</span>
                        )}
                        {!isOurs && hasParticipants && (
                          <div className="text-text-muted ml-1 shrink-0">
                            {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </div>
                        )}
                      </div>

                      {/* Opponent roster drill-down */}
                      {isOpen && !isOurs && (
                        <ClanDetail
                          clan={clan}
                          currentMemberTags={clanMemberTags?.[clan.tag] ? new Set(clanMemberTags[clan.tag]) : undefined}
                          onClose={() => setOpenClanTag(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Our participants */}
          <div className="mt-4 mb-5">
            <p className="font-heading text-[0.6rem] tracking-[0.15em] text-text-muted uppercase mb-3">
              Our Participants ({currentParticipants.length})
            </p>
            <div className="space-y-1">
              {sorted.map(p => <ParticipantRow key={p.tag} p={p} />)}
              {sortedEx.length > 0 && (
                <>
                  <p className="font-heading text-[0.55rem] tracking-[0.15em] text-text-muted/50 uppercase pt-2 px-1">Left clan</p>
                  {sortedEx.map(p => (
                    <div key={p.tag} className="opacity-40">
                      <ParticipantRow p={p} />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Not participating */}
          {notParticipating.length > 0 && (
            <div>
              <p className="font-heading text-[0.6rem] tracking-[0.15em] text-red-clash uppercase mb-3 flex items-center gap-1.5">
                <AlertCircle size={11} strokeWidth={2} />
                Not in race yet ({notParticipating.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {notParticipating.map(m => (
                  <span key={m.tag} className="font-heading text-xs text-text-muted bg-navy-800/60 border border-red-clash/20 rounded-full px-3 py-1">
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
