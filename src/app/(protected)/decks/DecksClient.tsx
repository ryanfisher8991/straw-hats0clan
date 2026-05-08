"use client";

import { useState } from "react";
import { Shield, AlertTriangle, Zap } from "lucide-react";
import type { ScoredDeck } from "@/types/clash";

const ARCHETYPE_STYLES: Record<string, { label: string; class: string }> = {
  cycle:    { label: "Cycle",    class: "bg-blue-clash/20 text-blue-clash border-blue-clash/30" },
  beatdown: { label: "Beatdown", class: "bg-red-clash/20 text-red-light border-red-clash/30" },
  control:  { label: "Control",  class: "bg-green-clash/20 text-green-clash border-green-clash/30" },
  siege:    { label: "Siege",    class: "bg-gold-700/30 text-gold-300 border-gold-700/40" },
};

function ScoreMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 80 ? "#22c55e" : pct >= 55 ? "#f4c842" : "#e03030";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-navy-500 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="font-display text-xs shrink-0" style={{ color }}>{pct}</span>
    </div>
  );
}

function DeckCard({ deck, index }: { deck: ScoredDeck; index: number }) {
  const arch = ARCHETYPE_STYLES[deck.archetype] ?? ARCHETYPE_STYLES.cycle;

  return (
    <div
      className="card-base p-5 flex flex-col gap-4"
      style={{ animation: `fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) ${index * 0.08}s both` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-display text-sm shrink-0"
            style={{
              background: `linear-gradient(135deg, rgba(244,200,66,0.15), rgba(244,200,66,0.05))`,
              border: "1px solid rgba(244,200,66,0.2)",
              color: "#f4c842",
            }}
          >
            {index + 1}
          </div>
          <div>
            <h3 className="font-heading text-sm tracking-wide text-text-primary leading-tight">{deck.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge-role border text-[0.55rem] ${arch.class}`}>{arch.label}</span>
              <span className="font-heading text-[0.6rem] text-text-muted tracking-wider flex items-center gap-1">
                <Zap size={9} className="text-blue-clash" />{deck.avg_elixir} avg elixir
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="font-heading text-[0.6rem] tracking-[0.15em] text-text-muted uppercase">Match Score</span>
        </div>
        <ScoreMeter score={deck.score} />
      </div>

      {/* Cards */}
      <div>
        <p className="font-heading text-[0.6rem] tracking-[0.15em] text-text-muted uppercase mb-2">Cards</p>
        <div className="flex flex-wrap gap-1.5">
          {deck.cards.map(card => {
            const missing = deck.missingCards.includes(card);
            const underleveled = deck.underleveledCards.find(u => u.name === card);
            return (
              <div
                key={card}
                className={`px-2.5 py-1 rounded-md text-xs font-body border ${
                  missing
                    ? "bg-red-clash/10 text-red-clash border-red-clash/30 line-through"
                    : underleveled
                    ? "bg-gold-700/20 text-gold-300 border-gold-700/30"
                    : "bg-navy-700/60 text-text-primary border-navy-500"
                }`}
              >
                {card}
                {underleveled && (
                  <span className="ml-1 text-gold-500">({underleveled.current}→{underleveled.recommended})</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Warnings */}
      {(deck.missingCards.length > 0 || deck.underleveledCards.length > 0) && (
        <div className="bg-navy-800 rounded-lg p-3 border border-navy-500 space-y-1">
          {deck.missingCards.length > 0 && (
            <p className="text-xs font-body text-red-clash flex items-start gap-1.5">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              Missing: {deck.missingCards.join(", ")}
            </p>
          )}
          {deck.underleveledCards.length > 0 && (
            <p className="text-xs font-body text-gold-400 flex items-start gap-1.5">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              Underleveled: {deck.underleveledCards.map(u => `${u.name} (Lv.${u.current})`).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function DecksClient({ members }: { members: { tag: string; name: string }[] }) {
  const [selectedTag, setSelectedTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [decks, setDecks] = useState<ScoredDeck[] | null>(null);
  const [error, setError] = useState("");

  const selectedMember = members.find(m => m.tag === selectedTag);

  async function fetchDecks(tag: string) {
    setLoading(true);
    setError("");
    setDecks(null);
    try {
      const res = await fetch(`/api/player?tag=${encodeURIComponent(tag)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");

      const { scoreDecks, findBestWarDecks } = await import("@/lib/deck-scorer");
      const scored = scoreDecks(data.player.cards ?? [], data.metaDecks ?? []);
      const best4 = findBestWarDecks(scored);
      setDecks(best4);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tag = e.target.value;
    setSelectedTag(tag);
    if (tag) fetchDecks(tag);
  }

  return (
    <div>
      {/* Member selector */}
      <div className="max-w-sm mb-8 animate-fade-up" style={{ opacity: 0, animationDelay: "0.1s" }}>
        <label className="font-heading text-[0.65rem] tracking-[0.2em] text-text-muted uppercase block mb-2">
          Select Your Name
        </label>
        <select
          value={selectedTag}
          onChange={handleChange}
          className="input-clash w-full rounded-lg px-4 py-3 text-sm appearance-none cursor-pointer"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23617090' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
        >
          <option value="" disabled>Choose a clan member...</option>
          {members.map(m => (
            <option key={m.tag} value={m.tag}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-4 py-16 animate-fade-in">
          <div className="w-10 h-10 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
          <p className="font-heading text-sm tracking-wider text-text-muted">Analyzing cards...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card-base p-5 border-red-clash/30 bg-red-clash/5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-clash shrink-0 mt-0.5" />
          <p className="font-body text-sm text-red-clash">{error}</p>
        </div>
      )}

      {/* No decks in DB */}
      {decks !== null && decks.length === 0 && (
        <div className="card-base p-10 text-center">
          <Shield size={32} className="text-text-muted mx-auto mb-3" />
          <p className="font-heading text-sm text-text-muted tracking-wider">No meta decks in database yet</p>
          <p className="font-body text-xs text-text-muted mt-1">Run the seed SQL in your Supabase dashboard</p>
        </div>
      )}

      {/* Deck results */}
      {decks !== null && decks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xs tracking-[0.2em] text-text-muted uppercase">
              Best 4 War Decks · {selectedMember?.name}
            </h2>
            <p className="font-body text-xs text-text-muted">No card used twice</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {decks.map((deck, i) => (
              <DeckCard key={deck.id} deck={deck} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && decks === null && (
        <div className="flex flex-col items-center gap-3 py-20 animate-fade-in">
          <Shield size={40} className="text-navy-500" />
          <p className="font-heading text-sm tracking-wider text-text-muted">Select a member to see their war decks</p>
        </div>
      )}
    </div>
  );
}
