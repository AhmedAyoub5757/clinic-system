import { api } from "../lib/apiClient";
import { cleanParams } from "../lib/params";

// GET /doctors → { items, meta }
export async function listDoctors(params = {}) {
  const res = await api.get("/doctors", { params: cleanParams(params) });
  return { items: res.data.data, meta: res.data.meta };
}