import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { realtimeHub } from '../utils/realtimeHub';

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

function getInitialUser(): User | null {
  try {
    const raw = localStorage.getItem('royal_cached_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitialWallet(): Wallet | null {
  try {
    const raw = localStorage.getItem('royal_cached_wallet');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('royal_user_token');
  const initialUser = token ? getInitialUser() : null;
  const initialWallet = token ? getInitialWallet() : null;

  const [user, setUser] = useState<User | null>(initialUser);
  const [wallet, setWallet] = useState<Wallet | null>(initialWallet);
  // If we already have a cached user and token, don't show full-page loading spinner!
  const [loading, setLoading] = useState<boolean>(!token ? false : !initialUser);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('royal_user_token');
    if (!currentToken) {
      setUser(null);
      setWallet(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setWallet(res.user.wallet);
      try {
        localStorage.setItem('royal_cached_user', JSON.stringify(res.user));
        if (res.user.wallet) {
          localStorage.setItem('royal_cached_wallet', JSON.stringify(res.user.wallet));
        }
      } catch {}
    } catch (err) {
      localStorage.removeItem('royal_user_token');
      localStorage.removeItem('royal_cached_user');
      localStorage.removeItem('royal_cached_wallet');
      setUser(null);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Connect user to Supabase Realtime Channel
  useEffect(() => {
    if (user?.id) {
      realtimeHub.init(user.id);
    } else {
      realtimeHub.cleanup();
    }
    return () => {
      realtimeHub.cleanup();
    };
  }, [user?.id]);

  // Listen for realtime events across the app to silently update wallet/user without reloading
  useEffect(() => {
    const handleLiveEvent = () => {
      const currentToken = localStorage.getItem('royal_user_token');
      if (currentToken) {
        api
          .getMe()
          .then((res) => {
            if (res?.user) {
              setUser(res.user);
              if (res.user.wallet) {
                setWallet(res.user.wallet);
                try {
                  localStorage.setItem('royal_cached_wallet', JSON.stringify(res.user.wallet));
                } catch {}
              }
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('royal_live_update', handleLiveEvent);
    return () => window.removeEventListener('royal_live_update', handleLiveEvent);
  }, []);

  const login = (token: string, userData: User, walletData?: Wallet) => {
    localStorage.setItem('royal_user_token', token);
    setUser(userData);
    try {
      localStorage.setItem('royal_cached_user', JSON.stringify(userData));
      if (walletData) {
        localStorage.setItem('royal_cached_wallet', JSON.stringify(walletData));
      }
    } catch {}
    if (walletData) setWallet(walletData);
  };

  const logout = () => {
    api.logout().catch(() => {});
    localStorage.removeItem('royal_user_token');
    localStorage.removeItem('royal_cached_user');
    localStorage.removeItem('royal_cached_wallet');
    setUser(null);
    setWallet(null);
  };

  return (
    <AuthContext.Provider value={{ user, wallet, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
