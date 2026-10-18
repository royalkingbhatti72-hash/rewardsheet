import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface User {
  id: string;
  name: string;
  phone: string;
  referralCode: string;
  accountStatus: string;
  mustChangePassword?: boolean;
}

export interface Wallet {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalUnlockFees: number;
  creditPoints?: number;
}

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  loading: boolean;
  login: (token: string, userData: User, walletData?: Wallet) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('royal_user_token');
    if (!token) {
      setUser(null);
      setWallet(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setWallet(res.user.wallet);
    } catch (err) {
      localStorage.removeItem('royal_user_token');
      setUser(null);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, userData: User, walletData?: Wallet) => {
    localStorage.setItem('royal_user_token', token);
    setUser(userData);
    if (walletData) setWallet(walletData);
  };

  const logout = () => {
    api.logout().catch(() => {});
    localStorage.removeItem('royal_user_token');
    setUser(null);
    setWallet(null);
  };

  return (
    <AuthContext.Provider value={{ user, wallet, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
