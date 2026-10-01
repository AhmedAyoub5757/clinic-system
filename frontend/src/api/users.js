import { api } from "../lib/apiClient";
import { cleanParams } from "../lib/params";

// GET /users → { items, meta }
export async function listUsers(params = {}) {
  const res = await api.get("/users", { params: cleanParams(params) });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getUser(id) {
  const res = await api.get(`/users/${id}`);
  return res.data.data;
}

export async function createUser(payload) {
  const res = await api.post("/users", payload);
  return res.data.data;
}

export async function updateUser(id, payload) {
  const res = await api.put(`/users/${id}`, payload);
  return res.data.data;
}

export async function deleteUser(id) {
  await api.delete(`/users/${id}`);
}