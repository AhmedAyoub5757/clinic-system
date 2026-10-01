import { api } from "../lib/apiClient";

// GET /admin/dashboard → stats
export async function getDashboard() {
  const res = await api.get("/admin/dashboard");
  return res.data.data;
}