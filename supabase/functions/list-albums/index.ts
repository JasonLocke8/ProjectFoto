// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'
import { corsHeadersForRequest } from '../_shared/cors.ts'

type Json = Record<string, unknown>
type AlbumRow = { slug: string | null; title: string | null }

function json(req: Request, status: number, body: Json) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersForRequest(req), 'content-type': 'application/json' },
  })
}

function env(name: string) {
  return Deno.env.get(name)
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersForRequest(req) })
  }

  if (req.method !== 'GET') return json(req, 405, { error: 'Method not allowed' })

  const adminSecret = env('ADMIN_SECRET')
  const providedSecret = req.headers.get('x-admin-secret') ?? ''

  if (!adminSecret) return json(req, 500, { error: 'Missing ADMIN_SECRET' })
  if (!providedSecret || providedSecret !== adminSecret) {
    return json(req, 403, { error: 'Forbidden' })
  }

  const supabaseUrl = env('SUPABASE_URL')
  const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return json(req, 500, { error: 'Missing SUPABASE env vars' })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabaseAdmin.from('albums').select('slug, title')
  if (error) return json(req, 500, { error: error.message })

  return json(req, 200, {
    albums: ((data ?? []) as AlbumRow[]).map((row) => ({ slug: row.slug, title: row.title })),
  })
})
