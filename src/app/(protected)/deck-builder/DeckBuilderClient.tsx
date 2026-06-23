"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Loader2, Swords, ChevronRight, FlaskConical, Star } from "lucide-react";
import { WAR_DECK_SETS, normalizeCardName, type DeckSet, type WarDeck } from "@/lib/war-deck-sets";
import type { PlayerCard } from "@/types/clash";

interface Member {
  tag: string;
  name: string;
  role: string;
  trophies: number;
  clanRank: number;
}

interface Props {
  members: Member[];
}

// The CR API is stuck on the old 1-14 level scale. The game's current max is 16
// (raised 14→15 in Dec 2023, 15→16 in Nov 2025). Add 2 to every displayed level.
const API_LEVEL_OFFSET = 2;
const GAME_MAX_LEVEL = 16;

function toGameLevel(apiLevel: number): number {
  return Math.min(apiLevel + API_LEVEL_OFFSET, GAME_MAX_LEVEL);
}

// ── Scoring ──────────────────────────────────────────────────────────────────

function scoreSet(set: DeckSet, cardMap: Map<string, PlayerCard>): number {
  const allCards = set.decks.flatMap(d => d.cards);
  let total = 0;
  for (const card of allCards) {
    const pc = cardMap.get(normalizeCardName(card.name));
    if (pc) total += toGameLevel(pc.level) / GAME_MAX_LEVEL;
  }
  return total / allCards.length;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelColor(gameLevel: number): string {
  const r = gameLevel / GAME_MAX_LEVEL;
  if (r >= 1)    return "#39ff14";
  if (r >= 0.9)  return "#fbbf24";
  if (r >= 0.75) return "#f97316";
  return "#ef4444";
}

function fitBadge(score: number): { label: string; color: string; border: string; bg: string } {
  if (score >= 0.9) return { label: "Excellent", color: "#39ff14", border: "rgba(57,255,20,0.35)", bg: "rgba(57,255,20,0.08)" };
  if (score >= 0.75) return { label: "Good",      color: "#4ade80", border: "rgba(74,222,128,0.35)", bg: "rgba(74,222,128,0.08)" };
  if (score >= 0.6)  return { label: "Fair",      color: "#fbbf24", border: "rgba(251,191,36,0.35)", bg: "rgba(251,191,36,0.08)" };
  return              { label: "Weak",      color: "#ef4444", border: "rgba(239,68,68,0.35)",   bg: "rgba(239,68,68,0.08)"   };
}

// ── Card cell ────────────────────────────────────────────────────────────────

const HERO_RARITIES = new Set(["champion", "hero"]);

function CardCell({
  cardName, playerCard,
}: {
  cardName: string;
  playerCard?: PlayerCard;
}) {
  const gameLevel = playerCard ? toGameLevel(playerCard.level) : 0;
  const hasCard = !!playerCard;
  const color = hasCard ? levelColor(gameLevel) : "#4a5568";
  const iconSrc = playerCard?.iconUrls?.medium;
  const displayName = cardName
    .replace("P.E.K.K.A", "PEKKA")
    .replace("Mini P.E.K.K.A", "Mini PEKKA");

  const hasEvo = (playerCard?.evolutionLevel ?? 0) > 0;
  const isHero = HERO_RARITIES.has((playerCard?.rarity ?? "").toLowerCase());

  return (
    <div className={`flex flex-col items-center gap-0.5 ${!hasCard ? "opacity-35" : ""}`}>
      {/* Card image */}
      <div className="relative">
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-navy-500/60 bg-navy-800 flex items-center justify-center">
          {iconSrc ? (
            <img src={iconSrc} alt={cardName} className="w-full h-full object-contain" />
          ) : (
            <Swords size={14} className="text-navy-500" strokeWidth={1} />
          )}
        </div>

        {/* EVO badge — player actually has evo unlocked */}
        {hasEvo && (
          <span
            className="absolute -top-1 -right-1 font-heading text-[0.4rem] tracking-tight px-1 py-px rounded-sm font-bold leading-tight"
            style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)", color: "#fff" }}
          >
            EVO
          </span>
        )}

        {/* Hero/Champion ability badge */}
        {isHero && !hasEvo && (
          <span
            className="absolute -top-1 -right-1 font-heading text-[0.4rem] tracking-tight px-1 py-px rounded-sm font-bold leading-tight"
            style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff" }}
          >
            HERO
          </span>
        )}
      </div>

      {/* Card name */}
      <span className="font-heading text-[0.47rem] tracking-wide text-text-muted text-center leading-tight max-w-[52px] truncate mt-0.5">
        {displayName}
      </span>

      {/* Level */}
      {hasCard ? (
        <span className="font-heading text-[0.55rem] tracking-wide" style={{ color }}>
          lvl {gameLevel}
        </span>
      ) : (
        <span className="font-heading text-[0.5rem] text-navy-500">missing</span>
      )}
    </div>
  );
}

// ── Single deck card ─────────────────────────────────────────────────────────

function DeckCard({
  deck,
  cardMap,
  index,
}: {
  deck: WarDeck;
  cardMap: Map<string, PlayerCard>;
  index: number;
}) {
  const [copied, setCopied] = useState(false);

  const deckScore = (() => {
    let t = 0;
    for (const c of deck.cards) {
      const pc = cardMap.get(normalizeCardName(c.name));
      if (pc) t += toGameLevel(pc.level) / GAME_MAX_LEVEL;
    }
    return t / deck.cards.length;
  })();

  function handleCopy() {
    const ids = deck.cards
      .map(c => cardMap.get(normalizeCardName(c.name))?.id)
      .filter((id): id is number => id !== undefined);

    if (ids.length === 8) {
      const link = `https://link.clashroyale.com/deck/en?deck=${ids.join(";")}`;
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  }

  const accentColors = ["#f59e0b", "#38bdf8", "#4ade80", "#e879f9"];
  const accent = accentColors[index % accentColors.length];

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: `linear-gradient(145deg, ${accent}08 0%, rgba(8,14,28,0.95) 60%)`,
        border: `1px solid ${accent}30`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-4 rounded-full shrink-0"
            style={{ background: accent }}
          />
          <p className="font-heading text-xs tracking-wider text-text-primary">{deck.label}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-display text-xs" style={{ color: levelColor(Math.round(deckScore * GAME_MAX_LEVEL)) }}>
            {Math.round(deckScore * 100)}%
          </span>
          <button
            onClick={handleCopy}
            title="Copy deck link for Clash Royale"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.6rem] font-heading tracking-wide transition-colors"
            style={{
              background: copied ? "rgba(57,255,20,0.12)" : "rgba(255,255,255,0.04)",
              border: copied ? "1px solid rgba(57,255,20,0.4)" : "1px solid rgba(255,255,255,0.1)",
              color: copied ? "#39ff14" : "#94a3b8",
            }}
          >
            {copied ? <Check size={10} strokeWidth={2.5} /> : <Copy size={10} strokeWidth={1.5} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Card grid — 4 × 2 */}
      <div className="grid grid-cols-4 gap-2">
        {deck.cards.map((card, i) => (
          <CardCell
            key={i}
            cardName={card.name}
            playerCard={cardMap.get(normalizeCardName(card.name))}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────

export default function DeckBuilderClient({ members }: Props) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [cardMap, setCardMap] = useState<Map<string, PlayerCard> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSetIdx, setActiveSetIdx] = useState(0);

  const loadMember = useCallback(async (member: Member) => {
    if (member.tag === selectedTag && cardMap) return;
    setSelectedTag(member.tag);
    setSelectedName(member.name);
    setLoading(true);
    setError(null);
    setCardMap(null);
    setActiveSetIdx(0);

    try {
      const res = await fetch(`/api/player?tag=${encodeURIComponent(member.tag)}`);
      if (!res.ok) throw new Error("API error");
      const data: { player: { cards: PlayerCard[] } } = await res.json();
      const map = new Map<string, PlayerCard>();
      for (const card of data.player.cards ?? []) {
        map.set(card.name.toLowerCase().trim(), card);
      }
      setCardMap(map);
    } catch {
      setError("Could not load card data. Try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedTag, cardMap]);

  const scoredSets = cardMap
    ? [...WAR_DECK_SETS]
        .map(set => ({ set, score: scoreSet(set, cardMap) }))
        .sort((a, b) => b.score - a.score)
    : null;

  const activeScored = scoredSets?.[activeSetIdx];

  const roleColors: Record<string, string> = {
    leader:   "text-gold-400",
    coLeader: "text-blue-clash",
    elder:    "text-text-secondary",
    member:   "text-text-muted",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

      {/* ── Member list ────────────────────────────── */}
      <div className="card-base p-4 animate-fade-up" style={{ opacity: 0, animationDelay: "0.1s" }}>
        <p className="font-heading text-[0.6rem] tracking-[0.2em] text-text-muted uppercase mb-3 px-1">
          Select Member ({members.length})
        </p>
        <div className="space-y-0.5 max-h-[70vh] lg:max-h-[80vh] overflow-y-auto pr-0.5">
          {members.map(member => {
            const isSelected = selectedTag === member.tag;
            return (
              <button
                key={member.tag}
                onClick={() => loadMember(member)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isSelected
                    ? "bg-gold-700/20 border border-gold-700/40"
                    : "hover:bg-navy-800 border border-transparent"
                }`}
              >
                <span className="font-heading text-[0.6rem] tracking-wide text-text-muted/60 w-5 shrink-0 text-right">
                  {member.clanRank}
                </span>
                <span className={`flex-1 font-heading text-sm tracking-wide truncate ${
                  isSelected ? "text-gold-400" : "text-text-primary"
                }`}>
                  {member.name}
                </span>
                {isSelected
                  ? <ChevronRight size={12} className="text-gold-400 shrink-0" />
                  : <span className={`font-heading text-[0.55rem] tracking-wide uppercase shrink-0 ${roleColors[member.role] ?? roleColors.member}`}>
                      {member.role === "coLeader" ? "Co" : member.role.slice(0, 3)}
                    </span>
                }
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Deck view ──────────────────────────────── */}
      <div className="flex flex-col gap-4">

        {/* Empty state */}
        {!selectedTag && (
          <div
            className="card-base p-16 flex flex-col items-center justify-center gap-4 text-center animate-fade-up"
            style={{ opacity: 0, animationDelay: "0.15s" }}
          >
            <FlaskConical size={36} className="text-text-muted/40" strokeWidth={1} />
            <div>
              <p className="font-heading text-text-muted tracking-wider text-sm">Select a member</p>
              <p className="font-body text-text-muted/50 text-xs mt-1">
                We&apos;ll find the best 4-deck war set based on their card levels
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {selectedTag && loading && (
          <div className="card-base p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="text-gold-400 animate-spin" />
            <p className="font-heading text-text-muted text-sm tracking-wide">
              Loading {selectedName}&apos;s cards…
            </p>
          </div>
        )}

        {/* Error */}
        {selectedTag && error && !loading && (
          <div className="card-base p-8 text-center">
            <p className="font-heading text-red-clash text-sm">{error}</p>
            <button
              className="mt-3 font-heading text-xs text-text-muted underline"
              onClick={() => { setError(null); if (selectedTag) loadMember(members.find(m => m.tag === selectedTag)!); }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Results */}
        {selectedTag && scoredSets && !loading && (
          <>
            {/* Member header + ranked deck set tabs */}
            <div className="card-base p-5 animate-fade-up" style={{ opacity: 0, animationDelay: "0.1s" }}>
              <p className="font-heading text-[0.55rem] tracking-[0.2em] text-text-muted uppercase mb-0.5">Best war deck sets for</p>
              <p className="font-display text-xl text-gold-gradient mb-4">{selectedName}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {scoredSets.slice(0, 6).map((scored, i) => {
                  const fit = fitBadge(scored.score);
                  const isActive = activeSetIdx === i;
                  return (
                    <button
                      key={scored.set.id}
                      onClick={() => setActiveSetIdx(i)}
                      className="text-left rounded-xl p-3 border transition-colors"
                      style={{
                        background: isActive ? "rgba(248,215,120,0.08)" : "rgba(255,255,255,0.02)",
                        borderColor: isActive ? "rgba(248,215,120,0.4)" : "rgba(255,255,255,0.07)",
                      }}
                    >
                      {i === 0 && (
                        <div className="flex items-center gap-1 mb-1">
                          <Star size={9} style={{ color: "#fbbf24", fill: "#fbbf24" }} />
                          <span className="font-heading text-[0.5rem] tracking-wider text-gold-400 uppercase">Best fit</span>
                        </div>
                      )}
                      <p className={`font-heading text-xs tracking-wide truncate ${isActive ? "text-gold-400" : "text-text-primary"}`}>
                        {scored.set.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="font-heading text-[0.5rem] tracking-wider uppercase px-1.5 py-px rounded border"
                          style={{ color: fit.color, borderColor: fit.border, background: fit.bg }}
                        >
                          {fit.label}
                        </span>
                        <span className="font-display text-xs text-text-muted">{Math.round(scored.score * 100)}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active deck set */}
            {activeScored && (
              <>
                <p className="font-heading text-[0.55rem] tracking-[0.2em] text-text-muted uppercase px-1">
                  {activeScored.set.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeScored.set.decks.map((deck, i) => (
                    <DeckCard
                      key={`${activeScored.set.id}-${i}`}
                      deck={deck}
                      cardMap={cardMap!}
                      index={i}
                    />
                  ))}
                </div>
                <p className="font-body text-[0.65rem] text-text-muted/50 text-center pt-1">
                  Copy a deck link and open it on your phone — Clash Royale will import it automatically
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
