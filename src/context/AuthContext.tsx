import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, PermissionKey } from '../types';
import { AuthService } from '../services/authService';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  hasPermission: (permission: PermissionKey) => boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const { showToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.warn('Failed to load initial auth session:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to live Supabase Auth state changes
    const unsubscribe = AuthService.onAuthStateChange((updatedUser) => {
      setUser(updatedUser);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const loggedUser = await AuthService.login(email, password);
      setUser(loggedUser);
      setIsAuthModalOpen(false);
      showToast(`Welcome back, ${loggedUser.full_name}!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    role: UserRole = 'customer'
  ) => {
    try {
      setLoading(true);
      const newUser = await AuthService.register(email, password, fullName, phone, role);
      setUser(newUser);
      setIsAuthModalOpen(false);
      showToast(`Account created successfully! Welcome, ${newUser.full_name}.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      showToast('Logged out successfully', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const updated = await AuthService.updateProfile(user.id, updates);
      setUser(updated);
      showToast('Profile updated successfully', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Failed to update profile: ${msg}`, 'error');
      throw err;
    }
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    return AuthService.hasPermission(user, permission);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const role = user?.role || null;
  const isAdmin = role === 'admin';
  const isStaff = role === 'admin' || role === 'manager';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        isAdmin,
        isStaff,
        login,
        register,
        logout,
        updateProfile,
        hasPermission,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
