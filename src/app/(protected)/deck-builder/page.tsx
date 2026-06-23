import { getClanMembers } from "@/lib/cr-api";
import DeckBuilderClient from "./DeckBuilderClient";
import type { ClanMember } from "@/types/clash";

export const revalidate = 300;

export default async function DeckBuilderPage() {
  let members: ClanMember[] = [];
  try {
    const res = await getClanMembers();
    members = res?.items ?? [];
  } catch {
    members = [];
  }

  const memberList = members.map((m: ClanMember) => ({
    tag: m.tag,
    name: m.name,
    role: m.role,
    trophies: m.trophies,
    clanRank: m.clanRank,
  }));

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8 animate-fade-up" style={{ opacity: 0, animationDelay: "0.05s" }}>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-display text-2xl sm:text-3xl text-gold-gradient">Deck Builder</h1>
          <span
            className="font-heading text-[0.55rem] tracking-[0.2em] uppercase px-2 py-0.5 rounded border"
            style={{ color: "#fb923c", borderColor: "rgba(251,146,60,0.35)", background: "rgba(251,146,60,0.08)" }}
          >
            Experimental
          </span>
        </div>
        <p className="text-text-muted text-sm font-body">
          Select a member to see their best 4-deck war setup based on their actual card levels
        </p>
      </div>

      <DeckBuilderClient members={memberList} />
    </div>
  );
}
