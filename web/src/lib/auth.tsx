import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UNAUTHORIZED_EVENT } from "../api/client";
import { hasFlag } from "./flags";
import {
  clearToken,
  decodeToken,
  getToken,
  SessionUser,
  setToken,
  TOKEN_KEY,
} from "./token";

interface AuthContextValue {
  user: SessionUser | null;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(() => decodeToken(getToken()));
  const [crashed, setCrashed] = useState(false);
  // Bug mode `bug-auth`: a 401 crashes the app instead of logging out: a blank page.
  if (crashed) throw new Error("Unhandled 401 (bug-auth)");

  const login = useCallback(
    (token: string) => {
      setToken(token);
      setUser(decodeToken(token));
      queryClient.removeQueries({ queryKey: ["private"] });
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    queryClient.removeQueries({ queryKey: ["private"] });
  }, [queryClient]);

  useEffect(() => {
    const onUnauthorized = () =>
      hasFlag("bug-auth") ? setCrashed(true) : logout();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    // Logging in or out in another tab.
    const onStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === null)
        setUser(decodeToken(getToken()));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
      window.removeEventListener("storage", onStorage);
    };
  }, [logout]);

  const value = useMemo(
    () => ({ user, isAdmin: user?.role === "ROLE_ADMIN", login, logout }),
    [user, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
