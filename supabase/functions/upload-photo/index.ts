// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'
import { corsHeadersForRequest } from '../_shared/cors.ts'

type Json = Record<string, unknown>

function json(req: Request, status: number, body: Json) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersForRequest(req), 'content-type': 'application/json' },
  })
}

function env(name: string) {
  return Deno.env.get(name)
}

function splitList(value: string | undefined | null) {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function buildObjectPath(albumSlug: string, originalName: string) {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]+/g, '_')
  const ext = safeName.includes('.') ? safeName.split('.').pop() : undefined
  const base = crypto.randomUUID()
  const filename = ext ? `${base}.${ext}` : base
  return `${albumSlug}/${filename}`
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersForRequest(req) })
  }
  if (req.method !== 'POST') return json(req, 405, { error: 'Method not allowed' })

  const supabaseUrl = env('SUPABASE_URL')
  const supabaseAnonKey = env('SUPABASE_ANON_KEY')
  const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY')
  const bucket = env('PHOTOS_BUCKET') ?? 'photos'

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return json(req, 500, { error: 'Missing SUPABASE env vars' })
  }

  const adminUids = splitList(env('ADMIN_UIDS'))
  const adminEmails = splitList(env('ADMIN_EMAILS')).map((e) => e.toLowerCase())
  const adminSecret = env('ADMIN_SECRET')

  const authHeader = req.headers.get('authorization') ?? ''
  const providedSecret = req.headers.get('x-admin-secret') ?? ''

  // Option A (recommended): Supabase Auth JWT + allowlist
  // Option B (optional): shared secret for a separate admin dashboard
  let isAllowed = false

  if (adminSecret && providedSecret && providedSecret === adminSecret) {
    isAllowed = true
  } else if (authHeader.toLowerCase().startsWith('bearer ')) {
    const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabaseAuthClient.auth.getUser()
    if (error || !data.user) return json(req, 401, { error: 'Unauthorized' })

    const uidOk = adminUids.length === 0 ? true : adminUids.includes(data.user.id)
    const email = (data.user.email ?? '').toLowerCase()
    const emailOk = adminEmails.length === 0 ? true : adminEmails.includes(email)

    // If you set at least one allowlist, require match.
    const hasAllowlist = adminUids.length > 0 || adminEmails.length > 0
    isAllowed = hasAllowlist ? uidOk && emailOk : false
  }

  if (!isAllowed) {
    return json(req, 403, { error: 'Forbidden' })
  }

  const contentType = req.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return json(req, 400, { error: 'Expected multipart/form-data' })
  }

  const form = await req.formData()
  const albumSlug = String(form.get('album_slug') ?? '').trim()
  const alt = String(form.get('alt') ?? '').trim()
  const captionRaw = form.get('caption')
  const caption = captionRaw == null ? null : String(captionRaw).trim() || null
  const file = form.get('file')

  if (!albumSlug) return json(req, 400, { error: 'album_slug is required' })
  if (!alt) return json(req, 400, { error: 'alt is required' })
  if (!(file instanceof File)) return json(req, 400, { error: 'file is required' })

  const maxBytes = Number(env('MAX_UPLOAD_BYTES') ?? 15 * 1024 * 1024)
  if (file.size > maxBytes) {
    return json(req, 413, { error: `File too large. Max ${maxBytes} bytes.` })
  }

  const allowedTypes = splitList(env('ALLOWED_MIME_TYPES'))
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return json(req, 415, { error: `Unsupported type: ${file.type}` })
  }

  const path = buildObjectPath(albumSlug, file.name || 'upload')

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })

  if (uploadError) return json(req, 500, { error: uploadError.message })

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('photos')
    .insert({
      album_slug: albumSlug,
      alt,
      caption,
      image_path: path,
    })
    .select('id, image_path')
    .single()

  if (insertError) return json(req, 500, { error: insertError.message })

  const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)

  return json(req, 200, {
    ok: true,
    photo: {
      id: inserted.id,
      image_path: inserted.image_path,
      public_url: publicData.publicUrl,
    },
  })
})
