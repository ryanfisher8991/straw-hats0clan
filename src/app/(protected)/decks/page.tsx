import { getClanMembers } from "@/lib/cr-api";
import DecksClient from "./DecksClient";

export const revalidate = 300;

export default async function DecksPage() {
  let members: { tag: string; name: string }[] = [];
  try {
    const res = await getClanMembers();
    members = (res?.items ?? []).map((m: { tag: string; name: string; clanRank: number }) => ({
      tag: m.tag,
      name: m.name,
      clanRank: m.clanRank,
    }));
  } catch {}

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8 animate-fade-up" style={{ opacity: 0, animationDelay: "0.05s" }}>
        <h1 className="font-display text-2xl sm:text-3xl text-gold-gradient mb-1">War Decks</h1>
        <p className="text-text-muted text-sm font-body">
          Select your name to get your best 4 non-overlapping war decks
        </p>
      </div>
      <DecksClient members={members} />
    </div>
  );
}
