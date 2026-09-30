import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import { tokenStorage } from "../lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a token exists we must ask the API who it belongs to before rendering routes
  const [loading, setLoading] = useState(Boolean(tokenStorage.get()));

  // On page refresh: restore the session from the stored token
  useEffect(() => {
    if (!tokenStorage.get()) return;

    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  // The API client tells us when a token stops working
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("auth:unauthenticated", onExpired);
    return () => window.removeEventListener("auth:unauthenticated", onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await authApi.login(email, password);
    tokenStorage.set(token);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout(); // revokes the token on the server
    } catch {
      // even if the call fails, the local session must end
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}