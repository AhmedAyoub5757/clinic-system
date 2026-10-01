const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Local-timezone dates. Don't use toISOString(): it converts to UTC and can return yesterday.
export const todayString = () => fmt(new Date());

export function tomorrowString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return fmt(d);
}