import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
      if (token) {
        try {
          const response = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCurrentUser(response.data.user);
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem('nexus_token');
        }
      }
      setIsLoading(false);
    };
    
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('nexus_token', token);
      setCurrentUser(user);
      
      return { success: true, user };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Invalid email or password. Please check your credentials.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
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
