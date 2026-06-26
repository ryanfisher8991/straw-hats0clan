/** Returns true for any CR API state that means war battles are active. */
export function isWarDay(state: string): boolean {
  return ["warDay", "full", "war"].includes(state.toLowerCase());
}
