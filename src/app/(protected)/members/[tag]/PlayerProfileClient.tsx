"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface CardBase {
  name: string;
  level?: number;
  maxLevel: number;
  rarity: string;
  iconUrls: { medium: string; heroMedium?: string; evolutionMedium?: string };
  elixirCost?: number;
  evolutionLevel?: number;
  starLevel?: number;
}

interface OwnedCard extends CardBase {
  level: number;
  count: number;
  maxEvolutionLevel?: number;
}

interface LeagueSeason {
  id?: string;
  trophies?: number;
  bestTrophies?: number;
  rank?: number | null;
}

interface PathSeason {
  leagueNumber?: number;
  trophies?: number;
  rank?: number | null;
}

interface Badge {
  name: string;
  level?: number;
  maxLevel?: number;
  progress?: number;
  target?: number;
  iconUrls?: { large: string };
}

interface Achievement {
  name: string;
  stars: number;
  value: number;
  target: number;
  info: string;
  completionInfo?: string | null;
}

interface Player {
  tag: string;
  name: string;
  expLevel: number;
  expPoints?: number;
  totalExpPoints?: number;
  starPoints?: number;
  trophies: number;
  bestTrophies: number;
  legacyTrophyRoadHighScore?: number;
  wins: number;
  losses: number;
  battleCount: number;
  threeCrownWins: number;
  currentWinLoseStreak?: number;
  challengeCardsWon: number;
  challengeMaxWins: number;
  tournamentCardsWon: number;
  tournamentBattleCount: number;
  warDayWins: number;
  donations: number;
  donationsReceived: number;
  totalDonations: number;
  clanCardsCollected?: number;
  role?: string;
  clan?: { name: string; tag: string };
  arena?: { name: string };
  leagueStatistics?: {
    currentSeason?: LeagueSeason;
    previousSeason?: LeagueSeason;
    bestSeason?: LeagueSeason;
  };
  currentPathOfLegendSeasonResult?: PathSeason;
  lastPathOfLegendSeasonResult?: PathSeason;
  bestPathOfLegendSeasonResult?: PathSeason;
  currentDeck?: CardBase[];
  supportCards?: CardBase[];
  currentFavouriteCard?: CardBase;
  cards: OwnedCard[];
  badges?: Badge[];
  achievements?: Achievement[];
}

// ── Level helpers ────────────────────────────────────────────────────────────
const IN_GAME_MAX = 16;
const RARITY_API_MAX: Record<string, number> = {
  common: 16, rare: 14, epic: 11, legendary: 8, champion: 6,
};
function displayLevel(level: number, rarity: string): number {
  const apiMax = RARITY_API_MAX[(rarity ?? "common").toLowerCase()] ?? 16;
  return level + (IN_GAME_MAX - apiMax);
}
function levelColor(lvl: number): string {
  if (lvl >= IN_GAME_MAX)     return "bg-gold-400 text-navy-950";
  if (lvl >= IN_GAME_MAX - 2) return "bg-green-clash/80 text-white";
  if (lvl >= IN_GAME_MAX - 5) return "bg-blue-clash/80 text-white";
  return "bg-navy-700 text-text-muted";
}

// ── Rarity border ────────────────────────────────────────────────────────────
const RARITY_BORDER: Record<string, string> = {
  common:    "border-gray-500/50",
  rare:      "border-yellow-500/60",
  epic:      "border-purple-500/70",
  legendary: "border-transparent",
  champion:  "border-yellow-300/90",
};

// ── Stat block ───────────────────────────────────────────────────────────────
function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-navy-800/60 rounded-lg p-3 border border-navy-600/40 text-center">
      <p className="font-display text-lg text-text-primary leading-none">{value}</p>
      {sub && <p className="font-heading text-[0.5rem] tracking-wide text-gold-500 mt-0.5">{sub}</p>}
      <p className="font-heading text-[0.55rem] tracking-[0.12em] text-text-muted uppercase mt-1">{label}</p>
    </div>
  );
}

// ── Card tile ────────────────────────────────────────────────────────────────
function CardTile({ card, size = "md" }: { card: CardBase & { level?: number; count?: number }; size?: "sm" | "md" }) {
  const rarity = (card.rarity ?? "common").toLowerCase();
  const isLegendary = rarity === "legendary";
  const isHero = !!card.iconUrls?.heroMedium;
  const hasEvo = !!card.iconUrls?.evolutionMedium;
  const border = RARITY_BORDER[rarity] ?? RARITY_BORDER.common;
  const lvl = card.level != null ? displayLevel(card.level, card.rarity) : null;
  const sizeClass = size === "sm" ? "text-[0.4rem]" : "text-[0.45rem]";

  const inner = (
    <div
      className={`relative rounded-lg border ${isLegendary ? "border-transparent" : border} overflow-hidden bg-navy-800/80 group w-full h-full`}
      style={{ aspectRatio: "3/4" }}
    >
      {card.iconUrls?.medium && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.iconUrls.medium} alt={card.name} className="w-full h-full object-contain p-0.5" />
      )}
      {lvl != null && (
        <div className={`absolute bottom-0 left-0 right-0 text-center py-0.5 font-heading leading-tight tracking-wide ${sizeClass} ${levelColor(lvl)}`}>
          {lvl}
        </div>
      )}
      <div className="absolute inset-0 bg-navy-950/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
        <p className={`font-heading text-gold-300 text-center leading-tight ${sizeClass}`}>{card.name}</p>
      </div>
    </div>
  );

  return (
    <div className="relative" style={{ aspectRatio: "3/4" }} title={`${card.name}${lvl != null ? ` · Lv ${lvl}/${IN_GAME_MAX}` : ""}`}>
      {(isHero || hasEvo) && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-0.5 z-20">
          {isHero && <div className="w-2 h-2 rotate-45 shadow-md" style={{ background: "linear-gradient(135deg,#f8d978,#b88418)", borderRadius: "2px" }} />}
          {hasEvo && <div className="w-2 h-2 rotate-45 shadow-md" style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", borderRadius: "2px" }} />}
        </div>
      )}
      {isLegendary ? (
        <div className="rounded-lg p-px w-full h-full" style={{ background: "linear-gradient(135deg,#ff0080,#ff8c00,#ffe600,#00ff88,#00cfff,#cc00ff,#ff0080)", aspectRatio: "3/4" }}>
          <div className="rounded-lg overflow-hidden w-full h-full bg-navy-800/80 relative group" style={{ aspectRatio: "3/4" }}>
            {card.iconUrls?.medium && <img src={card.iconUrls.medium} alt={card.name} className="w-full h-full object-contain p-0.5" />}
            {lvl != null && <div className={`absolute bottom-0 left-0 right-0 text-center py-0.5 font-heading leading-tight tracking-wide ${sizeClass} ${levelColor(lvl)}`}>{lvl}</div>}
            <div className="absolute inset-0 bg-navy-950/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
              <p className={`font-heading text-gold-300 text-center leading-tight ${sizeClass}`}>{card.name}</p>
            </div>
          </div>
        </div>
      ) : inner}
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-base p-5 mb-4">
      <h2 className="font-heading text-[0.65rem] tracking-[0.2em] text-text-muted uppercase mb-4">{title}</h2>
      {children}
    </div>
  );
}

function winRate(w: number, l: number) {
  const t = w + l; return t ? `${Math.round(w / t * 100)}%` : "0%";
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PlayerProfileClient({ player }: { player: Player }) {
  const router = useRouter();

  const sortedCards = [...(player.cards ?? [])].sort(
    (a, b) => displayLevel(b.level, b.rarity) - displayLevel(a.level, a.rarity)
  );

  const polLabel = (p?: PathSeason) => {
    if (!p || (!p.trophies && !p.leagueNumber)) return "—";
    return `League ${p.leagueNumber ?? 0} · ${p.trophies ?? 0} trophies`;
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 font-heading text-xs tracking-[0.15em] text-text-muted hover:text-gold-300 transition-colors mb-6 uppercase"
      >
        <ArrowLeft size={13} strokeWidth={2} />
        Back to Members
      </button>

      {/* ── Identity ── */}
      <div className="card-base p-6 mb-4 animate-fade-up" style={{ opacity: 0, animationDelay: "0.05s" }}>
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-gold-gradient mb-1">{player.name}</h1>
            <p className="font-heading text-xs tracking-wider text-navy-400 uppercase">{player.tag}</p>
            {player.clan && <p className="font-heading text-xs text-text-muted tracking-wide mt-0.5">{player.clan.name}</p>}
            {player.arena && <p className="font-heading text-[0.6rem] tracking-[0.15em] text-navy-400 uppercase mt-0.5">{player.arena.name}</p>}
          </div>
          {player.currentFavouriteCard && (
            <div className="text-right">
              <p className="font-heading text-[0.55rem] tracking-[0.15em] text-text-muted uppercase mb-1">Favourite Card</p>
              <div className="w-12 ml-auto">
                <CardTile card={player.currentFavouriteCard} size="sm" />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          <Stat label="Level" value={player.expLevel} />
          <Stat label="Trophies" value={player.trophies.toLocaleString()} />
          <Stat label="Best Trophies" value={player.bestTrophies.toLocaleString()} />
          {player.legacyTrophyRoadHighScore ? <Stat label="Legacy High" value={player.legacyTrophyRoadHighScore.toLocaleString()} /> : null}
          <Stat label="Star Points" value={(player.starPoints ?? 0).toLocaleString()} />
          <Stat label="Exp Points" value={(player.expPoints ?? 0).toLocaleString()} />
        </div>
      </div>

      {/* ── Battle Stats ── */}
      <Section title="Battle Stats">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          <Stat label="Battles" value={player.battleCount.toLocaleString()} />
          <Stat label="Wins" value={player.wins.toLocaleString()} />
          <Stat label="Losses" value={player.losses.toLocaleString()} />
          <Stat label="Win Rate" value={winRate(player.wins, player.losses)} />
          <Stat label="3-Crown Wins" value={player.threeCrownWins.toLocaleString()} />
          <Stat label="Streak" value={player.currentWinLoseStreak ?? 0} />
          <Stat label="War Day Wins" value={player.warDayWins.toLocaleString()} />
          <Stat label="Challenge Max" value={player.challengeMaxWins.toLocaleString()} />
          <Stat label="Challenge Cards" value={player.challengeCardsWon.toLocaleString()} />
          <Stat label="Tournament Battles" value={player.tournamentBattleCount.toLocaleString()} />
          <Stat label="Tournament Cards" value={player.tournamentCardsWon.toLocaleString()} />
        </div>
      </Section>

      {/* ── Donations ── */}
      <Section title="Donations">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Donated" value={player.donations.toLocaleString()} sub="this season" />
          <Stat label="Received" value={player.donationsReceived.toLocaleString()} sub="this season" />
          <Stat label="Total Donated" value={player.totalDonations.toLocaleString()} sub="all time" />
          <Stat label="Clan Cards" value={(player.clanCardsCollected ?? 0).toLocaleString()} sub="collected" />
        </div>
      </Section>

      {/* ── League Statistics ── */}
      {player.leagueStatistics && (
        <Section title="League Statistics">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Current Season", data: player.leagueStatistics.currentSeason },
              { label: "Previous Season", data: player.leagueStatistics.previousSeason },
              { label: "Best Season", data: player.leagueStatistics.bestSeason },
            ].map(({ label, data }) => data ? (
              <div key={label} className="bg-navy-800/60 rounded-lg p-3 border border-navy-600/40">
                <p className="font-heading text-[0.55rem] tracking-[0.15em] text-text-muted uppercase mb-2">{label}</p>
                {data.id && <p className="font-heading text-[0.6rem] text-navy-400 mb-1">{data.id}</p>}
                <p className="font-display text-lg text-gold-gradient">{(data.trophies ?? 0).toLocaleString()}</p>
                <p className="font-heading text-[0.55rem] text-text-muted uppercase">trophies</p>
                {data.bestTrophies != null && (
                  <p className="font-heading text-[0.55rem] text-gold-500 mt-1">Best: {data.bestTrophies.toLocaleString()}</p>
                )}
              </div>
            ) : null)}
          </div>
        </Section>
      )}

      {/* ── Path of Legend ── */}
      {player.bestPathOfLegendSeasonResult?.leagueNumber ? (
        <Section title="Path of Legend">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Current Season", data: player.currentPathOfLegendSeasonResult },
              { label: "Last Season",    data: player.lastPathOfLegendSeasonResult },
              { label: "Best Season",    data: player.bestPathOfLegendSeasonResult },
            ].map(({ label, data }) => (
              <div key={label} className="bg-navy-800/60 rounded-lg p-3 border border-navy-600/40">
                <p className="font-heading text-[0.55rem] tracking-[0.15em] text-text-muted uppercase mb-1">{label}</p>
                <p className="font-display text-base text-text-primary">{polLabel(data)}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ── Current Deck ── */}
      {player.currentDeck && player.currentDeck.length > 0 && (
        <Section title="Current Deck">
          <div className="grid grid-cols-8 gap-1.5 pt-2">
            {player.currentDeck.map((card) => (
              <CardTile key={card.name} card={card} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Support Cards ── */}
      {player.supportCards && player.supportCards.length > 0 && (
        <Section title="Tower Troops">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 pt-2">
            {player.supportCards.map((card) => (
              <CardTile key={card.name} card={card} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Achievements ── */}
      {player.achievements && player.achievements.length > 0 && (
        <Section title="Achievements">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {player.achievements.map((a) => (
              <div key={a.name} className="bg-navy-800/60 rounded-lg px-3 py-2 border border-navy-600/40 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-xs text-text-primary tracking-wide truncate">{a.name}</p>
                  <p className="font-body text-[0.6rem] text-text-muted">{a.info}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex gap-0.5 justify-end mb-0.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-sm ${i < a.stars ? "bg-gold-400" : "bg-navy-600"}`} />
                    ))}
                  </div>
                  <p className="font-heading text-[0.5rem] text-text-muted">{a.value.toLocaleString()} / {a.target.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Badges ── */}
      {player.badges && player.badges.filter(b => b.iconUrls).length > 0 && (
        <Section title="Badges">
          <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2">
            {player.badges.filter(b => b.iconUrls).map((badge) => (
              <div
                key={badge.name}
                title={`${badge.name}${badge.level ? ` · Lv ${badge.level}` : ""}`}
                className="relative rounded-lg bg-navy-800/60 border border-navy-600/40 overflow-hidden group"
                style={{ aspectRatio: "1" }}
              >
                {badge.iconUrls?.large && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={badge.iconUrls.large} alt={badge.name} className="w-full h-full object-contain p-1" />
                )}
                {badge.level != null && (
                  <div className="absolute bottom-0 left-0 right-0 text-center py-0.5 text-[0.4rem] font-heading bg-navy-900/80 text-text-muted">
                    {badge.level}/{badge.maxLevel}
                  </div>
                )}
                <div className="absolute inset-0 bg-navy-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                  <p className="text-[0.4rem] font-heading text-gold-300 text-center leading-tight">{badge.name.replace(/([A-Z])/g, " $1").trim()}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Card Collection ── */}
      <div className="card-base p-5 animate-fade-up" style={{ opacity: 0, animationDelay: "0.15s" }}>
        <div className="flex items-center gap-4 flex-wrap mb-4">
          <h2 className="font-heading text-[0.65rem] tracking-[0.2em] text-text-muted uppercase">
            Card Collection · {sortedCards.length} cards
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: "Common",    cls: "border-gray-500/50 bg-navy-800" },
              { label: "Rare",      cls: "border-yellow-500/60 bg-navy-800" },
              { label: "Epic",      cls: "border-purple-500/70 bg-navy-800" },
              { label: "Champion",  cls: "border-yellow-300/90 bg-navy-800" },
            ].map(({ label, cls }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-sm border ${cls}`} />
                <span className="font-heading text-[0.5rem] tracking-wide text-navy-400 uppercase">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "linear-gradient(135deg,#ff0080,#ffe600,#00cfff,#cc00ff)" }} />
              <span className="font-heading text-[0.5rem] tracking-wide text-navy-400 uppercase">Legendary</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rotate-45" style={{ background: "linear-gradient(135deg,#f8d978,#b88418)" }} />
              <span className="font-heading text-[0.5rem] tracking-wide text-navy-400 uppercase">Hero</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rotate-45" style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }} />
              <span className="font-heading text-[0.5rem] tracking-wide text-navy-400 uppercase">Evo</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-x-1.5 gap-y-3 pt-2">
          {sortedCards.map((card) => (
            <CardTile key={card.name} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
