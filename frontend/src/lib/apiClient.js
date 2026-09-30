import axios from "axios";

const TOKEN_KEY = "clinic_token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// One error shape for every screen, built from our documented error envelope
export class ApiError extends Error {
  constructor(message, status, errors = null, retryAfter = null) {
    super(message);
    this.status = status;         // HTTP status, 0 if the server was unreachable
    this.errors = errors;         // { field: ["message"] } on 422
    this.retryAfter = retryAfter; // seconds, on 429
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: "application/json" },
});

// Attach the token to every request (Swagger's "Authorize" padlock)
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn every failure into an ApiError
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const res = error.response;

    if (!res) {
      return Promise.reject(new ApiError("Cannot reach the server. Check your connection.", 0));
    }

    // 401 on any endpoint except login means the session is gone (expired or revoked).
    // A 401 on login just means wrong credentials, so it must not log anyone out.
    if (res.status === 401 && !error.config.url.includes("/auth/login")) {
      tokenStorage.clear();
      window.dispatchEvent(new Event("auth:unauthenticated"));
    }

    const retryAfter = res.headers["retry-after"] ? Number(res.headers["retry-after"]) : null;

    return Promise.reject(
      new ApiError(res.data?.message || "Something went wrong", res.status, res.data?.errors ?? null, retryAfter)
    );
  }
);