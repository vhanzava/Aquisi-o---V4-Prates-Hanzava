
import { createClient } from '@supabase/supabase-js';

// --- DEMO MODE CONFIGURATION ---
// Set this to TRUE to run the app entirely in the browser (Mock Data)
// Set this to FALSE when deploying to Vercel with real Supabase credentials
export const IS_DEMO_MODE = true; 

// Safely access environment variables to prevent crashes if import.meta.env is undefined
const getEnvVar = (key: string) => {
  try {
    const meta = import.meta as any;
    if (meta && meta.env) {
      return meta.env[key];
    }
  } catch (e) {
    // Ignore errors
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Helper to check if valid config exists
export const isSupabaseConfigured = 
  IS_DEMO_MODE || (!!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co');

if (!isSupabaseConfigured && !IS_DEMO_MODE) {
  console.warn(
    'Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Create the client with fallback values. 
// In DEMO_MODE, this client won't actually be used for data fetching.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
