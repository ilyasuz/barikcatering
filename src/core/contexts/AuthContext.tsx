import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { hashPassword } from '../utils/cryptoUtils';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, passwordHash: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session storage check
    const storedUser = sessionStorage.getItem('barik_app_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        sessionStorage.removeItem('barik_app_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, passwordHash: string) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, role, password')
        .eq('email', email)
        .single();

      if (error || !data) {
        return { success: false, error: 'E-posta veya şifre hatalı.' };
      }

      if (data.password !== passwordHash) {
        return { success: false, error: 'E-posta veya şifre hatalı.' };
      }

      const loggedInUser: AppUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as 'admin' | 'editor' | 'viewer'
      };

      setUser(loggedInUser);
      sessionStorage.setItem('barik_app_user', JSON.stringify(loggedInUser));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Giriş yapılırken bir hata oluştu.' };
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('barik_app_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
