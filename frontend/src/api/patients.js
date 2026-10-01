import { api } from "../lib/apiClient";

// GET /patients → { items, meta }
// Lists return the envelope's data AND meta, so this differs from auth.js.
export async function listPatients(params = {}) {
  // The API rejects empty filters (e.g. gender=""), so only send what has a value
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value != null)
  );

  const res = await api.get("/patients", { params: clean });
  return { items: res.data.data, meta: res.data.meta };
}