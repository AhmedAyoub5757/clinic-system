import { api } from "../lib/apiClient";

// GET /patients → { items, meta }
// Lists return the envelope's data AND meta, so this differs from auth.js.
export async function listPatients(params = {}) {
  // The API rejects empty filters (e.g. gender=""), so only send what has a value
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value != null),
  );

  const res = await api.get("/patients", { params: clean });
  return { items: res.data.data, meta: res.data.meta };
}

// GET /patients/{id} → patient
export async function getPatient(id) {
  const res = await api.get(`/patients/${id}`);
  return res.data.data;
}

// POST /patients → patient (201)
export async function createPatient(payload) {
  const res = await api.post("/patients", payload);
  return res.data.data;
}

// PUT /patients/{id} → patient
export async function updatePatient(id, payload) {
  const res = await api.put(`/patients/${id}`, payload);
  return res.data.data;
}

// DELETE /patients/{id} → no data
export async function deletePatient(id) {
  await api.delete(`/patients/${id}`);
}
