import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabaseClient: ReturnType<typeof createClient> | any

if (url && key) {
  supabaseClient = createClient(url, key)
} else {
  const noopQuery = {
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null })
  }
  const noop = {
    from: () => noopQuery,
    channel: () => ({ on: () => noop, subscribe: () => ({}) })
  }
  supabaseClient = noop
}

export const supabase = supabaseClient
