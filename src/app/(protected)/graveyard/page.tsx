import GraveyardClient from "./GraveyardClient";
import { supabase } from "@/lib/supabase";
import { getClanMembers, getRiverRaceLog } from "@/lib/cr-api";

export const revalidate = 0;

const CLAN_TAG = "#QPRQ88YP";

async function getGraveyard() {
  const { data, error } = await supabase
    .from("graveyard")
    .select("*")
    .order("kicked_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

async function getWarStats() {
  const { data } = await supabase
    .from("war_member_stats")
    .select("player_tag, player_name, fame, decks_used, boat_attacks");
  if (!data) return {};

  const stats: Record<string, { totalFame: number; warsPlayed: number; totalDecks: number }> = {};
  for (const row of data) {
    if (!stats[row.player_tag]) stats[row.player_tag] = { totalFame: 0, warsPlayed: 0, totalDecks: 0 };
    stats[row.player_tag].totalFame += row.fame;
    if (row.fame > 0) stats[row.player_tag].warsPlayed++;
    stats[row.player_tag].totalDecks += row.decks_used;
  }
  return stats;
}

async function autoSyncDepartures() {
  try {
    const [membersRes, raceLog] = await Promise.all([getClanMembers(), getRiverRaceLog()]);

    const currentTags = new Set<string>(
      (membersRes?.items ?? []).map((m: { tag: string }) => m.tag)
    );

    // Collect all participants across every race in the live CR API log
    const knownPlayers = new Map<string, string>();
    for (const race of raceLog?.items ?? []) {
      const entry = (race.standings ?? []).find(
        (s: { clan: { tag: string } }) => s.clan?.tag === CLAN_TAG
      );
      for (const p of entry?.clan?.participants ?? []) {
        knownPlayers.set(p.tag, p.name);
      }
    }

    // Also pull from war_member_stats for anyone older than the API window
    const { data: warPlayers } = await supabase
      .from("war_member_stats")
      .select("player_tag, player_name");
    for (const row of warPlayers ?? []) {
      if (!knownPlayers.has(row.player_tag)) {
        knownPlayers.set(row.player_tag, row.player_name);
      }
    }

    const { data: existing } = await supabase.from("graveyard").select("player_tag");
    const graveyardTags = new Set((existing ?? []).map((e: { player_tag: string }) => e.player_tag));

    const departed: { player_tag: string; player_name: string }[] = [];
    for (const [tag, name] of knownPlayers) {
      if (!currentTags.has(tag) && !graveyardTags.has(tag)) {
        departed.push({ player_tag: tag, player_name: name });
      }
    }

    if (departed.length > 0) {
      await supabase.from("graveyard").upsert(departed, { onConflict: "player_tag" });
    }
  } catch {
    // Silently fail — page still renders with existing data
  }
}

export default async function GraveyardPage() {
  await autoSyncDepartures();
  const [entries, warStats] = await Promise.all([getGraveyard(), getWarStats()]);

  return <GraveyardClient initialEntries={entries} warStats={warStats} />;
}
