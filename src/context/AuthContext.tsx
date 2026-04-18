import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const JWT_STORAGE_KEY = 'inat_jwt';

interface AuthState {
  jwt: string | null;
  username: string | null;
}

interface AuthContextValue extends AuthState {
  setAuth: (jwt: string, username: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(() => {
    const jwt = localStorage.getItem(JWT_STORAGE_KEY);
    return { jwt, username: jwt ? 'deg' : null };
  });

  const setAuth = useCallback((jwt: string, username: string) => {
    localStorage.setItem(JWT_STORAGE_KEY, jwt);
    setAuthState({ jwt, username });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(JWT_STORAGE_KEY);
    setAuthState({ jwt: null, username: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...auth, setAuth, logout, isAuthenticated: Boolean(auth.jwt) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
