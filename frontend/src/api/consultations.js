import { api } from "../lib/apiClient";
import { cleanParams } from "../lib/params";

// POST /appointments/{id}/consultation → consultation (201)
export async function recordConsultation(appointmentId, payload) {
  const res = await api.post(`/appointments/${appointmentId}/consultation`, payload);
  return res.data.data;
}

// GET /consultations/{id} → consultation
export async function getConsultation(id) {
  const res = await api.get(`/consultations/${id}`);
  return res.data.data;
}

// PUT /consultations/{id} → consultation
export async function updateConsultation(id, payload) {
  const res = await api.put(`/consultations/${id}`, payload);
  return res.data.data;
}

// GET /patients/{id}/history → { items, meta }
export async function getPatientHistory(patientId, params = {}) {
  const res = await api.get(`/patients/${patientId}/history`, { params: cleanParams(params) });
  return { items: res.data.data, meta: res.data.meta };
}