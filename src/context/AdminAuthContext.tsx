import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface Admin {
  id: string;
  username: string;
  role: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  loading: boolean;
  adminLogin: (token: string, adminData: Admin) => void;
  adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('royal_admin_token');
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    api.adminGetMe()
      .then((res) => {
        setAdmin(res.admin);
      })
      .catch(() => {
        localStorage.removeItem('royal_admin_token');
        setAdmin(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const adminLogin = (token: string, adminData: Admin) => {
    localStorage.setItem('royal_admin_token', token);
    setAdmin(adminData);
  };

  const adminLogout = () => {
    api.adminLogout();
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
