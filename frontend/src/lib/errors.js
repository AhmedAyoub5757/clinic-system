// One message per documented status, shared by every screen
export function friendlyMessage(err) {
  if (err.status === 429) return `Too many requests. Try again in ${err.retryAfter ?? 60} seconds.`;
  return err.message;
}