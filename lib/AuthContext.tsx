import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface User {
  id: number;
  displayName: string;
  pictureUrl: string;
  role: 'admin' | 'user';
  exp: number; // Token expiration timestamp
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = async () => {
    setUser(null);
    await fetch('/api/auth/logout');
    router.push('/');
  };

  useEffect(() => {
    const loadUserFromCookies = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const userData: User = await res.json();
          setUser(userData);

          // Session Timeout Logic
          const expiresIn = (userData.exp * 1000) - Date.now();
          if (expiresIn > 0) {
            setTimeout(logout, expiresIn);
          } else {
            // If token is already expired
            logout();
          }
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromCookies();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);