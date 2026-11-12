import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { UserProfile, UserRole, PermissionKey } from '../types';

const AUTH_STORAGE_KEY = 'aura_auth_user_v2';
const USERS_REGISTRY_KEY = 'aura_local_users_v2';

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  admin: [
    'manage_all',
    'manage_products',
    'manage_orders',
    'manage_settings',
    'manage_affiliates',
    'view_own_orders',
  ],
  manager: [
    'manage_products',
    'manage_orders',
    'view_own_orders',
  ],
  customer: [
    'view_own_orders',
  ],
};

// Seed default accounts for local offline testing & fallback
const DEFAULT_LOCAL_PROFILES: (UserProfile & { passwordHash: string })[] = [
  {
    id: 'usr_admin_001',
    email: 'admin@aura-commerce.com',
    full_name: 'Store Administrator',
    role: 'admin',
    phone: '+1 555 019 9000',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    created_at: new Date('2026-01-01').toISOString(),
    passwordHash: 'admin123',
  },
  {
    id: 'usr_customer_001',
    email: 'customer@aura-commerce.com',
    full_name: 'Leila Mansour',
    role: 'customer',
    phone: '+971 50 987 6543',
    created_at: new Date('2026-02-15').toISOString(),
    passwordHash: 'customer123',
  },
];

const getLocalRegistry = (): (UserProfile & { passwordHash: string })[] => {
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    if (!raw) {
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(DEFAULT_LOCAL_PROFILES));
      return DEFAULT_LOCAL_PROFILES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_LOCAL_PROFILES;
  }
};

const saveLocalRegistry = (users: (UserProfile & { passwordHash: string })[]) => {
  try {
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save local users registry:', err);
  }
};

export class AuthService {
  /**
   * Retrieves the current active user profile
   */
  static async getCurrentUser(): Promise<UserProfile | null> {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        const { data: { user }, error } = await client.auth.getUser();
        if (error || !user) return null;

        // Fetch profile with role from 'profiles' table
        const { data: profile, error: profError } = await client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profError && profile) {
          return profile as UserProfile;
        }

        // Fallback to user metadata if profile row is not yet created
        return {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: (user.user_metadata?.role as UserRole) || 'customer',
          created_at: user.created_at,
        };
      } catch (err) {
        console.warn('Supabase getCurrentUser failed, checking local:', err);
      }
    }

    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  /**
   * Logs in a user using Supabase auth or fallback registry
   */
  static async login(email: string, password: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const client = getSupabaseClient();

    if (client && isSupabaseConfigured()) {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Login failed. No user record returned.');
      }

      // Fetch profile
      const { data: profile } = await client
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const userProfile: UserProfile = profile || {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        full_name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
        role: (data.user.user_metadata?.role as UserRole) || 'customer',
        created_at: data.user.created_at,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
      return userProfile;
    }

    // Local authentication fallback for development / offline use
    const registry = getLocalRegistry();
    const matched = registry.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.passwordHash === password
    );

    if (!matched) {
      throw new Error('Invalid email or password. (Hint: Use admin@aura-commerce.com / admin123 or register a new account).');
    }

    const { passwordHash: _, ...profile } = matched;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    return profile;
  }

  /**
   * Registers a new user with Supabase auth and creates a profile
   */
  static async register(
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    role: UserRole = 'customer'
  ): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const client = getSupabaseClient();

    if (client && isSupabaseConfigured()) {
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            phone,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Registration failed.');
      }

      const newProfile: UserProfile = {
        id: data.user.id,
        email: cleanEmail,
        full_name: fullName,
        role,
        phone,
        created_at: new Date().toISOString(),
      };

      // Ensure profile row exists in 'profiles' table
      try {
        await client.from('profiles').upsert(newProfile);
      } catch (err) {
        console.warn('Upsert profile trigger handled by DB:', err);
      }

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newProfile));
      return newProfile;
    }

    // Local registration
    const registry = getLocalRegistry();
    if (registry.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    const newProfile: UserProfile = {
      id: 'usr_' + Date.now().toString(36),
      email: cleanEmail,
      full_name: fullName,
      role,
      phone,
      created_at: new Date().toISOString(),
    };

    saveLocalRegistry([...registry, { ...newProfile, passwordHash: password }]);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newProfile));
    return newProfile;
  }

  /**
   * Logs out the current user session
   */
  static async logout(): Promise<void> {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  /**
   * Updates an existing user profile
   */
  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      const { data, error } = await client
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (!error && data) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        return data as UserProfile;
      }
    }

    const current = await this.getCurrentUser();
    if (current && current.id === userId) {
      const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));

      const registry = getLocalRegistry();
      const updatedRegistry = registry.map((u) =>
        u.id === userId ? { ...u, ...updates, updated_at: new Date().toISOString() } : u
      );
      saveLocalRegistry(updatedRegistry);
      return updated;
    }

    throw new Error('User not found.');
  }

  /**
   * Checks if a user has a specific RBAC permission
   */
  static hasPermission(user: UserProfile | null, permission: PermissionKey): boolean {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes('manage_all') || permissions.includes(permission);
  }

  /**
   * Subscribes to Supabase Auth state changes
   */
  static onAuthStateChange(callback: (user: UserProfile | null) => void) {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await this.getCurrentUser();
          callback(profile);
        } else {
          callback(null);
        }
      });
      return () => subscription.unsubscribe();
    }
    return () => {};
  }
}
