import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ✅ Singleton prevents multiple instances
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "myyard-auth-token",
      // ✅ FIXED: Generic <R> satisfies LockFunc type
      lock: <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
        return fn()
      },
    },
  })

  return supabaseInstance
}

export const supabase = getSupabaseClient()