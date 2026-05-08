import { getPlayer } from "@/lib/cr-api";
import { notFound } from "next/navigation";
import PlayerProfileClient from "./PlayerProfileClient";

export const revalidate = 300;

export default async function PlayerProfilePage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const fullTag = `#${tag}`;

  try {
    const player = await getPlayer(fullTag);
    if (!player) notFound();
    return <PlayerProfileClient player={player} />;
  } catch {
    notFound();
  }
}
