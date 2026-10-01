import { api } from "../lib/apiClient";
import { cleanParams } from "../lib/params";

// GET /doctors → { items, meta }
export async function listDoctors(params = {}) {
  const res = await api.get("/doctors", { params: cleanParams(params) });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getDoctor(id) {
  const res = await api.get(`/doctors/${id}`);
  return res.data.data;
}

export async function createDoctor(payload) {
  const res = await api.post("/doctors", payload);
  return res.data.data;
}

export async function updateDoctor(id, payload) {
  const res = await api.put(`/doctors/${id}`, payload);
  return res.data.data;
}