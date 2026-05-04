import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_DATABASE_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_DATABASE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseInstance
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabase()
    const value = client[prop as keyof SupabaseClient]
    
    if (typeof value === 'function') {
      return value.bind(client)
    }
    
    return value
  }
})

// Cliente admin que bypasea RLS
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_DATABASE_SUPABASE_URL!,
  process.env.DATABASE_SUPABASE_SERVICE_ROLE_KEY!
)