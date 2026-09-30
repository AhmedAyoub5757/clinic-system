import { api } from "../lib/apiClient";

// POST /auth/login  → { token, token_type, user }
export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password, device_name: "react-app" });
  return res.data.data;
}

// GET /auth/me  → user
export async function me() {
  const res = await api.get("/auth/me");
  return res.data.data;
}

// POST /auth/logout
export async function logout() {
  await api.post("/auth/logout");
}