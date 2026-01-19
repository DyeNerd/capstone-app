import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../utils/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('[AuthContext] checkAuth started');
    try {
      const token = localStorage.getItem('token');
      console.log('[AuthContext] Token in localStorage:', token ? 'exists' : 'none');
      if (token) {
        console.log('[AuthContext] Calling getCurrentUser API...');
        const result = await api.getCurrentUser();
        console.log('[AuthContext] getCurrentUser result:', result);
        if (result.success) {
          console.log('[AuthContext] Setting user:', result.user);
          setUser(result.user);
        } else {
          console.log('[AuthContext] getCurrentUser failed, removing token');
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('[AuthContext] checkAuth error:', error);
      localStorage.removeItem('token');
    } finally {
      console.log('[AuthContext] Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] login called', { email });
    try {
      const result = await api.login({ email, password });
      console.log('[AuthContext] login API result:', result);
      if (result.success) {
        localStorage.setItem('token', result.token);
        console.log('[AuthContext] Token saved, setting user:', result.user);
        setUser(result.user);
      } else {
        console.error('[AuthContext] login API failed:', result.error);
        throw new Error(result.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('[AuthContext] login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (email: string, username: string, password: string) => {
    console.log('[AuthContext] register called', { email, username });
    try {
      const result = await api.register({ email, username, password });
      console.log('[AuthContext] register API result:', result);
      if (result.success) {
        localStorage.setItem('token', result.token);
        console.log('[AuthContext] Token saved, setting user:', result.user);
        setUser(result.user);
      } else {
        console.error('[AuthContext] register API failed:', result.error);
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('[AuthContext] register error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

