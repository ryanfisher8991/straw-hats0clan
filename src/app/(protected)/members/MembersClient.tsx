"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown, Crown, TrendingUp, TrendingDown } from "lucide-react";
import type { ClanMember } from "@/types/clash";

type SortKey = "clanRank" | "trophies" | "donations" | "donationsReceived" | "expLevel" | "lifetimeFame";

const ROLE_STYLES: Record<string, string> = {
  leader:    "bg-gold-700/40 text-gold-300 border-gold-700/50",
  coLeader:  "bg-blue-clash/20 text-blue-clash border-blue-clash/30",
  elder:     "bg-navy-600/60 text-text-secondary border-navy-500",
  member:    "bg-navy-700/60 text-text-muted border-navy-600",
};

const ROLE_LABELS: Record<string, string> = {
  leader: "Leader", coLeader: "Co-Leader", elder: "Elder", member: "Member",
};

function formatLastSeen(lastSeen: string): string {
  if (!lastSeen) return "—";
  const y = lastSeen.slice(0, 4), mo = lastSeen.slice(4, 6), d = lastSeen.slice(6, 8);
  const h = lastSeen.slice(9, 11), mi = lastSeen.slice(11, 13);
  const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:00Z`);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 5) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const WAR_RANKS = [
  { name: "Hashira",   min: 59300,  color: "text-red-400",    border: "border-red-500/50",    bg: "bg-red-900/20"    },
  { name: "Shinigami", min: 29200,  color: "text-purple-400", border: "border-purple-500/50", bg: "bg-purple-900/20" },
  { name: "Diamond",   min: 14400,  color: "text-cyan-400",   border: "border-cyan-500/50",   bg: "bg-cyan-900/20"   },
  { name: "Gold",      min: 7100,   color: "text-gold-400",   border: "border-gold-700/50",   bg: "bg-gold-700/15"   },
  { name: "Silver",    min: 3500,   color: "text-slate-300",  border: "border-slate-500/50",  bg: "bg-slate-700/20"  },
  { name: "Copper",    min: 0,      color: "text-amber-700",  border: "border-amber-800/50",  bg: "bg-amber-900/20"  },
] as const;

function getWarRank(fame: number) {
  return WAR_RANKS.find(r => fame >= r.min) ?? WAR_RANKS[WAR_RANKS.length - 1];
}

function WarRankBadge({ fame }: { fame: number }) {
  if (!fame) return null;
  const rank = getWarRank(fame);
  return (
    <span className={`font-heading text-[0.55rem] tracking-wider uppercase px-1.5 py-0.5 rounded border ${rank.color} ${rank.border} ${rank.bg}`}>
      {rank.name}
    </span>
  );
}

function TrophyDelta({ delta }: { delta: number | undefined }) {
  if (delta === undefined || delta === 0) return <span className="text-text-muted font-heading text-xs">—</span>;
  const positive = delta > 0;
  return (
    <span className={`flex items-center justify-end gap-0.5 font-heading text-xs ${positive ? "text-green-clash" : "text-red-clash"}`}>
      {positive ? <TrendingUp size={11} strokeWidth={2} /> : <TrendingDown size={11} strokeWidth={2} />}
      {positive ? "+" : ""}{delta.toLocaleString()}
    </span>
  );
}

function SortHeader({ label, col, active, dir, onSort }: {
  label: string; col: SortKey; active: boolean; dir: "asc" | "desc"; onSort: (c: SortKey) => void;
}) {
  return (
    <button
      onClick={() => onSort(col)}
      className="flex items-center gap-1 font-heading text-[0.6rem] tracking-[0.15em] uppercase hover:text-text-primary transition-colors"
    >
      {label}
      {active ? (dir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : <ArrowUpDown size={10} className="opacity-40" />}
    </button>
  );
}

export default function MembersClient({
  members,
  lifetimeFame,
  trophyDeltas,
}: {
  members: ClanMember[];
  lifetimeFame: Record<string, number>;
  trophyDeltas: Record<string, number>;
}) {
  const [sort, setSort] = useState<SortKey>("clanRank");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const router = useRouter();

  function handleSort(col: SortKey) {
    if (sort === col) setDir(d => d === "asc" ? "desc" : "asc");
    else { setSort(col); setDir(col === "clanRank" ? "asc" : "desc"); }
  }

  function goToProfile(tag: string) {
    // strip # for URL
    router.push(`/members/${tag.replace("#", "")}`);
  }

  const sorted = useMemo(() => {
    let list = [...members];
    if (search) list = list.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      const av = sort === "lifetimeFame" ? (lifetimeFame[a.tag] ?? 0) : a[sort] as number;
      const bv = sort === "lifetimeFame" ? (lifetimeFame[b.tag] ?? 0) : b[sort] as number;
      return dir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [members, sort, dir, search, lifetimeFame]);

  const roleOrder = ["leader", "coLeader", "elder", "member"];
  const hasDeltas = Object.keys(trophyDeltas).length > 0;

  return (
    <div>
      {/* Search + filter bar */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-clash flex-1 rounded-lg px-4 py-2.5 text-sm"
        />
        <div className="font-heading text-xs tracking-wider text-text-muted flex items-center px-4 card-base">
          {sorted.length} / {members.length}
        </div>
      </div>

      {/* Role breakdown chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {roleOrder.map(role => {
          const count = members.filter(m => m.role === role).length;
          if (!count) return null;
          return (
            <div key={role} className={`badge-role border ${ROLE_STYLES[role]}`}>
              {ROLE_LABELS[role]} · {count}
            </div>
          );
        })}
        {!hasDeltas && (
          <div className="badge-role border border-navy-600 text-navy-400 text-[0.6rem]">
            Trophy trends available after first weekly snapshot
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="card-base overflow-hidden hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-500">
              <th className="text-left px-5 py-3 text-text-muted w-8">
                <SortHeader label="Rank" col="clanRank" active={sort === "clanRank"} dir={dir} onSort={handleSort} />
              </th>
              <th className="text-left px-4 py-3 text-text-muted">Name</th>
              <th className="text-right px-4 py-3 text-text-muted">
                <SortHeader label="Trophies" col="trophies" active={sort === "trophies"} dir={dir} onSort={handleSort} />
              </th>
              <th className="text-right px-4 py-3 text-text-muted">
                <span className="font-heading text-[0.6rem] tracking-[0.15em] uppercase">±Week</span>
              </th>
              <th className="text-right px-4 py-3 text-text-muted">
                <SortHeader label="Donated" col="donations" active={sort === "donations"} dir={dir} onSort={handleSort} />
              </th>
              <th className="text-right px-4 py-3 text-text-muted">
                <SortHeader label="Received" col="donationsReceived" active={sort === "donationsReceived"} dir={dir} onSort={handleSort} />
              </th>
              <th className="text-right px-4 py-3 text-text-muted">
                <SortHeader label="Level" col="expLevel" active={sort === "expLevel"} dir={dir} onSort={handleSort} />
              </th>
              <th className="text-right px-4 py-3 text-text-muted">
                <SortHeader label="War Fame" col="lifetimeFame" active={sort === "lifetimeFame"} dir={dir} onSort={handleSort} />
              </th>
              <th className="text-right px-5 py-3 text-text-muted">
                <span className="font-heading text-[0.6rem] tracking-[0.15em] uppercase">Last Seen</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr
                key={m.tag}
                onClick={() => goToProfile(m.tag)}
                className="border-b border-navy-600/50 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                style={{ animation: `fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.02}s both` }}
              >
                <td className="px-5 py-3 font-display text-sm text-text-muted text-center">{m.clanRank}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {m.role === "leader" && <Crown size={13} className="text-gold-400 shrink-0" />}
                    <span className="font-body text-sm text-text-primary font-semibold group-hover:text-gold-300 transition-colors">{m.name}</span>
                    <span className={`badge-role border ${ROLE_STYLES[m.role]}`}>
                      {ROLE_LABELS[m.role]}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-display text-sm text-gold-gradient">{m.trophies.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <TrophyDelta delta={trophyDeltas[m.tag]} />
                </td>
                <td className="px-4 py-3 text-right font-heading text-xs text-green-clash">{m.donations.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-heading text-xs text-text-secondary">{m.donationsReceived.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-heading text-xs text-text-secondary">{m.expLevel}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {lifetimeFame[m.tag] ? (
                      <>
                        <WarRankBadge fame={lifetimeFame[m.tag]} />
                        <span className="font-heading text-xs text-gold-500">{lifetimeFame[m.tag].toLocaleString()}</span>
                      </>
                    ) : <span className="text-text-muted font-heading text-xs">—</span>}
                  </div>
                </td>
                <td className="px-5 py-3 text-right font-body text-xs text-text-muted">{formatLastSeen(m.lastSeen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {sorted.map((m, i) => (
          <div
            key={m.tag}
            onClick={() => goToProfile(m.tag)}
            className="card-base p-4 flex items-center gap-3 cursor-pointer active:bg-white/[0.04]"
            style={{ animation: `fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.02}s both` }}
          >
            <span className="font-display text-sm text-text-muted w-6 text-center shrink-0">{m.clanRank}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {m.role === "leader" && <Crown size={12} className="text-gold-400 shrink-0" />}
                <span className="font-body text-sm text-text-primary font-semibold truncate">{m.name}</span>
                <span className={`badge-role border ${ROLE_STYLES[m.role]}`}>{ROLE_LABELS[m.role]}</span>
              </div>
              <div className="flex gap-3 mt-1 text-xs font-heading text-text-muted flex-wrap items-center">
                <span className="text-gold-400">{m.trophies.toLocaleString()} 🏆</span>
                {trophyDeltas[m.tag] !== undefined && trophyDeltas[m.tag] !== 0 && (
                  <TrophyDelta delta={trophyDeltas[m.tag]} />
                )}
                <span className="text-green-clash">{m.donations} donated</span>
                {lifetimeFame[m.tag] && (
                  <>
                    <WarRankBadge fame={lifetimeFame[m.tag]} />
                    <span className="text-gold-500">{lifetimeFame[m.tag].toLocaleString()} fame</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-body text-xs text-text-muted">{formatLastSeen(m.lastSeen)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
