import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bhiomaipnpdsthzpkped.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoaW9tYWlwbnBkc3RoenBrcGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDQzNDQsImV4cCI6MjA3MDUyMDM0NH0.KXQgw1ek_PE_HVpoEqqIsWnjPyFK45WE5-rENFe0V18"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
