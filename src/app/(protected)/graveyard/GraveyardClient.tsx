"use client";

import { useState } from "react";
import { Skull, Trash2, Sword, Trophy } from "lucide-react";

interface GraveyardEntry {
  id: string;
  player_tag: string;
  player_name: string;
  reason: string | null;
  kicked_at: string;
}

interface WarStats {
  [tag: string]: { totalFame: number; warsPlayed: number; totalDecks: number };
}

interface Props {
  initialEntries: GraveyardEntry[];
  warStats: WarStats;
}

export default function GraveyardClient({ initialEntries, warStats }: Props) {
  const [entries, setEntries] = useState<GraveyardEntry[]>(initialEntries);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch("/api/graveyard", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
    setDeletingId(null);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div
        className="mb-8 animate-fade-up"
        style={{ opacity: 0, animationDelay: "0.05s" }}
      >
        <h1 className="font-display text-2xl sm:text-3xl text-gold-gradient mb-1">Graveyard</h1>
        <p className="text-text-muted text-sm font-body">
          {entries.length} {entries.length === 1 ? "soul" : "souls"} resting here · auto-updated on page load
        </p>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="card-base p-12 text-center animate-fade-up" style={{ opacity: 0, animationDelay: "0.1s" }}>
          <Skull size={40} className="text-navy-500 mx-auto mb-4" strokeWidth={1} />
          <p className="font-heading text-sm text-text-muted tracking-wide">No souls in the graveyard yet.</p>
        </div>
      )}

      {/* Tombstone grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry, i) => {
          const stats = warStats[entry.player_tag];
          return (
            <div
              key={entry.id}
              className="card-base p-5 animate-fade-up relative group"
              style={{ opacity: 0, animationDelay: `${0.1 + i * 0.04}s` }}
            >
              {/* Tombstone top accent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px w-10 h-1 rounded-b-full bg-gradient-to-r from-navy-600 to-navy-500" />

              {/* Delete button */}
              <button
                onClick={() => handleDelete(entry.id)}
                disabled={deletingId === entry.id}
                className="absolute top-3 right-3 p-1.5 rounded text-navy-500 hover:text-red-clash transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                title="Remove from graveyard"
              >
                <Trash2 size={13} strokeWidth={1.5} />
              </button>

              {/* Skull icon + name */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-navy-800 border border-navy-600 flex items-center justify-center shrink-0">
                  <Skull size={16} className="text-navy-400" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-sm text-text-primary tracking-wide truncate">{entry.player_name}</p>
                  <p className="font-heading text-[0.6rem] tracking-wider text-navy-400 uppercase">{entry.player_tag}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="divider-gold mb-3" />

              {/* Reason */}
              {entry.reason && (
                <p className="font-body text-xs text-text-muted italic mb-3 leading-relaxed">
                  &ldquo;{entry.reason}&rdquo;
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                {stats ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <Trophy size={11} className="text-gold-500" strokeWidth={1.5} />
                      <span className="font-heading text-[0.65rem] tracking-wide text-gold-400">
                        {stats.totalFame.toLocaleString()} fame
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sword size={11} className="text-blue-clash" strokeWidth={1.5} />
                      <span className="font-heading text-[0.65rem] tracking-wide text-text-muted">
                        {stats.warsPlayed} wars
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="font-heading text-[0.6rem] text-navy-500 tracking-wide">No war history</span>
                )}
              </div>

              {/* Date */}
              <p className="font-heading text-[0.58rem] tracking-[0.15em] text-navy-500 uppercase">
                Departed {formatDate(entry.kicked_at)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
