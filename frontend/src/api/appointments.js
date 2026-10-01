import { api } from "../lib/apiClient";
import { cleanParams } from "../lib/params";

// GET /appointments → { items, meta }
export async function listAppointments(params = {}) {
  const res = await api.get("/appointments", { params: cleanParams(params) });
  return { items: res.data.data, meta: res.data.meta };
}

// GET /doctors/{id}/availability?date= → { doctor_id, date, day, slot_duration, slots }
export async function getAvailability(doctorId, date) {
  const res = await api.get(`/doctors/${doctorId}/availability`, { params: { date } });
  return res.data.data;
}

// POST /appointments → appointment (201)
export async function bookAppointment(payload) {
  const res = await api.post("/appointments", payload);
  return res.data.data;
}

// POST /appointments/{id}/confirm → updated appointment
export async function confirmAppointment(id) {
  const res = await api.post(`/appointments/${id}/confirm`);
  return res.data.data;
}

// POST /appointments/{id}/cancel → updated appointment
export async function cancelAppointment(id, cancellationReason) {
  const res = await api.post(`/appointments/${id}/cancel`, { cancellation_reason: cancellationReason });
  return res.data.data;
}