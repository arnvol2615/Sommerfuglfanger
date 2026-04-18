import { createContext, useState, useCallback, type ReactNode } from 'react';

const SESSION_TOKEN_STORAGE_KEY = 'session_token';

interface AuthState {
  sessionToken: string | null;
  username: string | null;
}

interface AuthContextValue extends AuthState {
  setAuth: (sessionToken: string, username: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(() => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
    return { sessionToken, username: sessionToken ? 'deg' : null };
  });

  const setAuth = useCallback((sessionToken: string, username: string) => {
    localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, sessionToken);
    setAuthState({ sessionToken, username });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    setAuthState({ sessionToken: null, username: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...auth, setAuth, logout, isAuthenticated: Boolean(auth.sessionToken) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

