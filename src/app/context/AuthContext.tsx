import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'hod' | 'principal' | 'lab-incharge';
  sub_role?: string;
  roll_number?: string;
  batch?: string;
  branch?: string;
  programme?: string;
  phone?: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('nexus_token');
      const savedUser = localStorage.getItem('nexus_user');
      
      if (token && savedUser) {
        try {
          // Optimistically set user from localStorage to prevent UI flash
          setCurrentUser(JSON.parse(savedUser));
          
          // Verify with backend in the background
          const response = await api.get('/api/auth/me');
          setCurrentUser(response.data.user);
          localStorage.setItem('nexus_user', JSON.stringify(response.data.user));
        } catch (error) {
          // Token invalid or expired
          logout();
        }
      }
      setIsLoading(false);
    };
    
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('nexus_token', token);
      localStorage.setItem('nexus_user', JSON.stringify(user));
      setCurrentUser(user);
      
      return { success: true, user };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Invalid email or password. Please check your credentials.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
