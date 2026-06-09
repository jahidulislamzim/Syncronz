export function isUserOnline(lastActiveString) {
  if (!lastActiveString) return false;
  const lastActive = new Date(lastActiveString).getTime();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return lastActive > fiveMinutesAgo;
}
