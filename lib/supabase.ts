import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ffkvytgvdqipscackxyg.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZma3Z5dGd2ZHFpcHNjYWNreHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Mjc2NDksImV4cCI6MjA4NzUwMzY0OX0.dVc6jytRfs3FFmk_oWMMJnI-sOH7Uz_LdAjcBiK2ukM"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "myyard-auth-token",
  },
})
