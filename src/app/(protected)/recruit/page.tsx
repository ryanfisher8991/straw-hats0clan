"use client";

import { useEffect, useState, useCallback } from "react";
import { UserPlus, Trash2, Trophy, Shield, ShieldOff, ExternalLink, AlertTriangle, Plus } from "lucide-react";

interface Prospect {
  id: string;
  tag: string;
  notes: string | null;
  addedAt: string;
  name: string | null;
  trophies: number | null;
  bestTrophies: number | null;
  expLevel: number | null;
  clan: { tag: string; name: string } | null;
  error: string | null;
}

export default function RecruitPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/recruit");
    const data = await res.json();
    setProspects(data.prospects ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    setAdding(true);
    setAddError(null);
    const res = await fetch("/api/recruit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: tagInput, notes: notesInput || null }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) {
      setAddError(data.error ?? "Failed to add prospect");
      return;
    }
    setTagInput("");
    setNotesInput("");
    await load();
  };

  const removeProspect = async (tag: string) => {
    await fetch("/api/recruit", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    });
    setProspects((prev) => prev.filter((p) => p.tag !== tag));
  };

  const clanlessCount = prospects.filter((p) => !p.clan && !p.error).length;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 animate-fade-up" style={{ opacity: 0, animationDelay: "0.05s" }}>
        <div className="flex items-start gap-3 mb-1">
          <UserPlus size={22} className="text-gold-400 mt-1 shrink-0" strokeWidth={1.5} />
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-gold-gradient">Recruit Watchlist</h1>
            <p className="text-text-muted text-sm font-body mt-0.5">
              Track prospective recruits you've found elsewhere — live trophies and clan status, refreshed every visit.
            </p>
          </div>
        </div>
      </div>

      {/* Add form */}
      <form
        onSubmit={addProspect}
        className="card-base p-5 mb-6 flex flex-col sm:flex-row gap-3 animate-fade-up"
        style={{ opacity: 0, animationDelay: "0.1s" }}
      >
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="Player tag — #ABC123 or ABC123"
          className="flex-1 bg-navy-800 border border-navy-500 rounded-lg px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold-400/50"
        />
        <input
          type="text"
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          placeholder="Notes (optional) — where you found them, etc."
          className="flex-1 bg-navy-800 border border-navy-500 rounded-lg px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold-400/50"
        />
        <button
          type="submit"
          disabled={adding || !tagInput.trim()}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gold-gradient text-navy-900 font-heading text-xs tracking-wide uppercase disabled:opacity-40 transition-opacity"
        >
          <Plus size={14} />
          Add
        </button>
      </form>
      {addError && (
        <p className="text-red-clash text-xs font-body -mt-4 mb-6 flex items-center gap-1.5">
          <AlertTriangle size={12} /> {addError}
        </p>
      )}

      {/* Summary */}
      {!loading && prospects.length > 0 && (
        <div className="flex items-center gap-4 mb-4 text-[0.65rem] font-heading tracking-[0.12em] text-text-muted uppercase">
          <span>{prospects.length} prospect{prospects.length !== 1 ? "s" : ""} tracked</span>
          <span className="text-green-clash flex items-center gap-1">
            <Shield size={11} /> {clanlessCount} still clanless
          </span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="card-base p-16 flex items-center justify-center">
          <p className="font-heading text-text-muted text-sm tracking-wide">Loading prospects…</p>
        </div>
      ) : prospects.length === 0 ? (
        <div className="card-base p-16 flex flex-col items-center justify-center gap-3">
          <UserPlus size={32} className="text-text-muted" strokeWidth={1} />
          <p className="font-heading text-text-muted tracking-wider text-sm text-center">
            No prospects yet — add a player tag above to start tracking them.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {prospects.map((p) => (
            <div
              key={p.id}
              className={`card-base p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                p.clan ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {p.error ? (
                  <AlertTriangle size={14} className="text-red-clash shrink-0" />
                ) : p.clan ? (
                  <ShieldOff size={14} className="text-text-muted shrink-0" />
                ) : (
                  <Shield size={14} className="text-green-clash shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-sm text-text-primary truncate">
                      {p.error ? p.tag : p.name}
                    </span>
                    <span className="font-heading text-[0.6rem] text-text-muted">{p.tag}</span>
                    {p.expLevel != null && (
                      <span className="font-heading text-[0.6rem] text-navy-400">Lv{p.expLevel}</span>
                    )}
                  </div>
                  {p.error ? (
                    <p className="text-red-clash text-xs font-body mt-0.5">{p.error}</p>
                  ) : p.clan ? (
                    <p className="text-text-muted text-xs font-body mt-0.5">
                      In a clan: <span className="text-text-secondary">{p.clan.name}</span> ({p.clan.tag})
                    </p>
                  ) : (
                    <p className="text-green-clash text-xs font-body mt-0.5">Clanless — free to invite</p>
                  )}
                  {p.notes && (
                    <p className="text-text-muted/70 text-xs font-body mt-0.5 italic">{p.notes}</p>
                  )}
                </div>
              </div>

              {p.trophies != null && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Trophy size={13} className="text-gold-400" />
                  <span className="font-display text-sm text-gold-gradient">{p.trophies.toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://link.clashroyale.com/en/?clashroyale://playerInfo?tag=${encodeURIComponent(p.tag.replace("#", ""))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-gold-400 transition-colors"
                  title="Open in Clash Royale"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => removeProspect(p.tag)}
                  className="p-2 rounded-lg hover:bg-red-clash/10 text-text-muted hover:text-red-clash transition-colors"
                  title="Remove from watchlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
