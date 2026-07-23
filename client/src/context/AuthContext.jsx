import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if token exists on application mount
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const profile = await authService.getProfile();
          setAdmin(profile);
        } catch (error) {
          console.error('Session initialization failed:', error);
          // Only clear session if server explicitly returns a 401 Unauthorized
          if (error.response && error.response.status === 401) {
            authService.logout();
            setAdmin(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      setAdmin({ _id: data._id, name: data.name, email: data.email, signatureUrl: data.signatureUrl });
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setAdmin(null);
  };

  const updateSignature = (signatureUrl) => {
    setAdmin((prev) => prev ? { ...prev, signatureUrl } : null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, updateSignature, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
