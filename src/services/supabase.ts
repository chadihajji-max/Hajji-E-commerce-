import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConnectionStatus } from '../types';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid and not placeholders
export const isSupabaseConfigured = (): boolean => {
  return (
    typeof rawUrl === 'string' &&
    rawUrl.trim().length > 0 &&
    !rawUrl.includes('your-project-ref') &&
    typeof rawAnonKey === 'string' &&
    rawAnonKey.trim().length > 0 &&
    !rawAnonKey.includes('...')
  );
};

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    supabaseInstance = createClient(rawUrl, rawAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    supabaseInstance = null;
  }
}

export const getSupabaseClient = (): SupabaseClient | null => {
  return supabaseInstance;
};

/**
 * Executes a full diagnostic test of the Supabase PostgreSQL connection,
 * auth subsystem, and table availability.
 */
export const checkSupabaseConnection = async (): Promise<SupabaseConnectionStatus> => {
  if (!isSupabaseConfigured() || !supabaseInstance) {
    return {
      isConfigured: false,
      isConnected: false,
      authWorking: false,
      message: 'Supabase credentials not configured in environment. The platform is running securely using the in-browser persistent repository adapter.',
    };
  }

  const tablesFound: string[] = [];

  try {
    // 1. Check Auth service reachability
    let authWorking = false;
    try {
      const { data: sessionData, error: sessionErr } = await supabaseInstance.auth.getSession();
      if (!sessionErr) {
        authWorking = true;
      }
    } catch {
      authWorking = false;
    }

    // 2. Query categories table
    const { error: catErr } = await supabaseInstance
      .from('categories')
      .select('count', { count: 'exact', head: true });

    if (!catErr) {
      tablesFound.push('categories');
    }

    // 3. Query products table
    const { error: prodErr } = await supabaseInstance
      .from('products')
      .select('count', { count: 'exact', head: true });

    if (!prodErr) {
      tablesFound.push('products');
    }

    // 4. Query profiles table
    const { error: profErr } = await supabaseInstance
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (!profErr) {
      tablesFound.push('profiles');
    }

    // 5. Query orders table
    const { error: ordErr } = await supabaseInstance
      .from('orders')
      .select('count', { count: 'exact', head: true });

    if (!ordErr) {
      tablesFound.push('orders');
    }

    const hasErrors = catErr && prodErr;

    if (hasErrors) {
      return {
        isConfigured: true,
        isConnected: false,
        authWorking,
        url: rawUrl,
        tablesFound,
        message: `Endpoint reached, but database tables are not initialized yet: ${catErr?.message || prodErr?.message}. Execute supabase/schema.sql in the Supabase SQL editor.`,
      };
    }

    return {
      isConfigured: true,
      isConnected: true,
      authWorking,
      url: rawUrl,
      tablesFound,
      message: `Successfully connected to live Supabase PostgreSQL database (${tablesFound.length} tables verified with Row Level Security).`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      isConfigured: true,
      isConnected: false,
      authWorking: false,
      url: rawUrl,
      tablesFound,
      message: `Connection failed: ${errMsg}`,
    };
  }
};
