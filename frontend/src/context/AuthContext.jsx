import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/constants';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Credenziali non valide');
    }

    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authUser', JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading,
      login,
      logout,
      get token() { return localStorage.getItem('authToken'); },
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
