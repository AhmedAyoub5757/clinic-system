// The API rejects empty filters (e.g. status=""), so only send values that exist
export function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value != null)
  );
}