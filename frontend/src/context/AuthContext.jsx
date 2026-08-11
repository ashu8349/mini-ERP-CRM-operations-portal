import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "@/services/auth.service";
import { setUnauthorizedHandler } from "@/services/api";
import { TOKEN_STORAGE_KEY } from "@/utils/constants";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    authService
      .me()
      .then((me) => {
        setUser({ id: me.id, name: me.name, email: me.email, role: me.role, isActive: me.isActive });
        setIsLoading(false);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: authedUser } = await authService.login(email, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(authedUser);
  }, []);

  const hasRole = useCallback(
    (...roles) => {
      return user !== null && roles.includes(user.role);
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, isLoading, login, logout, hasRole }),
    [user, isLoading, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}