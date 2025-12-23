
import { createClient } from '@supabase/supabase-js';

// --- DEMO MODE CONFIGURATION ---
// Set this to TRUE to run the app entirely in the browser (Mock Data)
// Set this to FALSE when deploying to Vercel with real Supabase credentials
export const IS_DEMO_MODE = false; 

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

// Configuration with Fallback to provided keys
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://istgijxeyqoyxzpavdrj.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdGdpanhleXFveXh6cGF2ZHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTU5ODEsImV4cCI6MjA4MjA5MTk4MX0.AdNz6V9-PzZZUlbpQWM2b6sblKu-j0P0t_bN9uJbh-U';

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
