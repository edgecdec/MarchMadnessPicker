export function isTournamentLocked(lockTime: string | null): boolean {
  return !!lockTime && new Date(lockTime) <= new Date();
}
