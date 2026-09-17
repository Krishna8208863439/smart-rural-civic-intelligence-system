import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import i18n from '../i18n/i18n';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('srci_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('srci_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('srci_user', JSON.stringify(res.data.user));
          if (res.data.user.language) {
            i18n.changeLanguage(res.data.user.language);
          }
        } catch (err) {
          console.warn('Session verification failed, logging out');
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: jwtToken, user: userData } = res.data;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('srci_token', jwtToken);
    localStorage.setItem('srci_user', JSON.stringify(userData));
    if (userData.language) {
      i18n.changeLanguage(userData.language);
      localStorage.setItem('srci_language', userData.language);
    }
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token: jwtToken, user: userData } = res.data;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('srci_token', jwtToken);
    localStorage.setItem('srci_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('srci_token');
    localStorage.removeItem('srci_user');
  };

  const switchLanguage = async (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('srci_language', langCode);
    if (user) {
      setUser((prev) => ({ ...prev, language: langCode }));
      try {
        await api.put('/auth/language', { language: langCode });
      } catch (err) {
        // ignore error
      }
    }
  };

  // Demo 1-Click login helper for evaluation
  const demoLogin = async (roleType) => {
    let email = 'citizen1@example.com';
    let password = 'citizen123';
    if (roleType === 'admin') {
      email = 'krishna@gmail.com';
      password = 'Sgi@5555';
    } else if (roleType === 'worker' || roleType === 'worker1' || roleType === 'worker2' || roleType === 'worker3') {
      email = 'kd@gmail.com';
      password = 'Sgi@5555';
    }
    return await login(email, password);
  };

  const updateUserData = (updates) => {
    setUser((prev) => {
      const nextUser = { ...(prev || {}), ...updates };
      localStorage.setItem('srci_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const normalizeRole = (r) => {
    if (!r) return 'guest';
    const lower = String(r).toLowerCase().trim();
    if (lower === 'worker' || lower === 'field_worker' || lower.includes('worker')) return 'worker';
    if (lower === 'admin' || lower.includes('admin')) return 'admin';
    return lower;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: normalizeRole(user?.role),
        loading,
        login,
        register,
        logout,
        switchLanguage,
        demoLogin,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
