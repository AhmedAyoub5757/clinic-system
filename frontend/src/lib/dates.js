// Today as YYYY-MM-DD in the user's LOCAL timezone.
// Don't use new Date().toISOString(): it converts to UTC, so early in the
// morning in Pakistan (UTC+5) it can return yesterday's date.
export function todayString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}