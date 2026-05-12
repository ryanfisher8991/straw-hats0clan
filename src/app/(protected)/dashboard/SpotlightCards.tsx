"use client";

import { Flame, Heart, TrendingUp } from "lucide-react";

interface SpotlightData {
  warHero: { name: string; fame: number } | null;
  topDonor: { name: string; donations: number } | null;
  risingStar: { name: string; delta: number } | null;
}

const WAR_RANKS = [
  { name: "Hashira",   min: 59300,  color: "#f87171" },
  { name: "Special Grade", min: 29200,  color: "#c084fc" },
  { name: "Diamond",   min: 14400,  color: "#22d3ee" },
  { name: "Gold",      min: 7100,   color: "#fbbf24" },
  { name: "Silver",    min: 3500,   color: "#94a3b8" },
  { name: "Copper",    min: 0,      color: "#b45309" },
];

function getWarRank(fame: number) {
  return WAR_RANKS.find(r => fame >= r.min) ?? WAR_RANKS[WAR_RANKS.length - 1];
}

interface CardProps {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  playerName: string | null;
  stat: string;
  statLabel: string;
  glowColor: string;
  delay: string;
  warFame?: number;
}

function SpotlightCard({ label, sublabel, icon, playerName, stat, statLabel, glowColor, delay, warFame }: CardProps) {
  const rank = warFame !== undefined ? getWarRank(warFame) : null;

  return (
    <>
      <style>{`
        @keyframes shimmer-sweep {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes border-breathe {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        .spotlight-name {
          background-size: 300% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer-sweep 4s linear infinite;
        }
      `}</style>

      <div
        className="relative rounded-2xl p-5 overflow-hidden animate-fade-up"
        style={{
          opacity: 0,
          animationDelay: delay,
          background: `linear-gradient(145deg, ${glowColor}0a 0%, rgba(8,14,28,0.98) 55%)`,
          border: `1px solid ${glowColor}45`,
          boxShadow: `0 0 30px ${glowColor}15, 0 0 60px ${glowColor}08, inset 0 1px 0 ${glowColor}25`,
        }}
      >
        {/* Watermark "1" */}
        <div
          className="absolute -right-3 -bottom-4 font-display leading-none select-none pointer-events-none"
          style={{ fontSize: "7rem", color: `${glowColor}08` }}
        >
          1
        </div>

        {/* Spotlight ray */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-24 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top, ${glowColor}12 0%, transparent 70%)`,
          }}
        />

        {/* Category header */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: `${glowColor}18`, border: `1px solid ${glowColor}35` }}
          >
            {icon}
          </div>
          <div>
            <p className="font-heading text-[0.6rem] tracking-[0.2em] uppercase" style={{ color: glowColor }}>
              {label}
            </p>
            <p className="font-heading text-[0.5rem] tracking-wider text-text-muted uppercase">{sublabel}</p>
          </div>
        </div>

        {/* Player name */}
        <p
          className="spotlight-name font-display text-2xl sm:text-3xl mb-2 leading-tight"
          style={{
            backgroundImage: `linear-gradient(90deg, ${glowColor}99 0%, #ffffff 40%, ${glowColor} 60%, #ffffff 80%, ${glowColor}99 100%)`,
          }}
        >
          {playerName ?? "—"}
        </p>

        {/* Stat */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-xl" style={{ color: glowColor }}>{stat}</span>
          <span className="font-heading text-[0.6rem] tracking-wider text-text-muted uppercase">{statLabel}</span>
        </div>

        {/* War rank badge */}
        {rank && warFame !== undefined && warFame > 0 && (
          <div
            className="absolute top-4 right-4 font-heading text-[0.5rem] tracking-wider uppercase px-2 py-0.5 rounded border"
            style={{ color: rank.color, borderColor: `${rank.color}50`, background: `${rank.color}15` }}
          >
            {rank.name}
          </div>
        )}
      </div>
    </>
  );
}

export default function SpotlightCards({ warHero, topDonor, risingStar }: SpotlightData) {
  return (
    <div className="mb-8">
      <p className="font-heading text-[0.6rem] tracking-[0.2em] text-text-muted uppercase mb-4">
        This Week&apos;s Standouts
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SpotlightCard
          label="War Hero"
          sublabel="Current Race"
          icon={<Flame size={13} strokeWidth={1.5} style={{ color: "#f59e0b" }} />}
          playerName={warHero?.name ?? null}
          stat={warHero ? warHero.fame.toLocaleString() : "—"}
          statLabel="fame"
          glowColor="#f59e0b"
          delay="0.35s"
          warFame={warHero?.fame}
        />
        <SpotlightCard
          label="Top Donor"
          sublabel="This Week"
          icon={<Heart size={13} strokeWidth={1.5} style={{ color: "#4ade80" }} />}
          playerName={topDonor?.name ?? null}
          stat={topDonor ? topDonor.donations.toLocaleString() : "—"}
          statLabel="donated"
          glowColor="#4ade80"
          delay="0.45s"
        />
        <SpotlightCard
          label="Rising Star"
          sublabel="Trophy Gain"
          icon={<TrendingUp size={13} strokeWidth={1.5} style={{ color: "#38bdf8" }} />}
          playerName={risingStar?.name ?? null}
          stat={risingStar && risingStar.delta > 0 ? `+${risingStar.delta.toLocaleString()}` : "—"}
          statLabel="trophies"
          glowColor="#38bdf8"
          delay="0.55s"
        />
      </div>
    </div>
  );
}
