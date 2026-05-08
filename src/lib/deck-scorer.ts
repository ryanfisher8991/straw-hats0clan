import type { PlayerCard, MetaDeck, ScoredDeck } from "@/types/clash";

const MIN_WAR_LEVEL = 11;

export function scoreDecks(cards: PlayerCard[], metaDecks: MetaDeck[]): ScoredDeck[] {
  const cardMap = new Map(cards.map(c => [c.name.toLowerCase(), c]));

  return metaDecks.map(deck => {
    let score = 100;
    const missingCards: string[] = [];
    const underleveledCards: { name: string; current: number; recommended: number }[] = [];

    for (const cardName of deck.cards) {
      const playerCard = cardMap.get(cardName.toLowerCase());
      if (!playerCard) {
        missingCards.push(cardName);
        score -= 35;
      } else if (playerCard.level < MIN_WAR_LEVEL) {
        const gap = MIN_WAR_LEVEL - playerCard.level;
        underleveledCards.push({ name: cardName, current: playerCard.level, recommended: MIN_WAR_LEVEL });
        score -= gap * 4;
      }
    }

    return { ...deck, score: Math.max(score, 0), missingCards, underleveledCards };
  }).sort((a, b) => b.score - a.score);
}

export function findBestWarDecks(scoredDecks: ScoredDeck[], count = 4): ScoredDeck[] {
  const usedCards = new Set<string>();
  const result: ScoredDeck[] = [];

  for (const deck of scoredDecks) {
    if (result.length >= count) break;
    const conflict = deck.cards.some(c => usedCards.has(c.toLowerCase()));
    if (!conflict) {
      result.push(deck);
      deck.cards.forEach(c => usedCards.add(c.toLowerCase()));
    }
  }

  return result;
}
