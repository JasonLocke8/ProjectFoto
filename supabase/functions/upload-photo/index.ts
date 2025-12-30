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

function isMissingColumnError(error: unknown, columnName: string) {
  if (!error) return false
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error)

  return message.toLowerCase().includes(`column "${columnName.toLowerCase()}"`) &&
    message.toLowerCase().includes('does not exist')
}

function normalizeTakenAt(value: unknown) {
  if (value == null) return null
  const raw = String(value).trim()
  if (!raw) return null

  // Allow YYYY-MM-DD (date only), DD/MM/YYYY (date only), or any ISO-ish string
  // that Date can parse.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw

  const ddmmyyyy = /^([0-3]\d)\/([0-1]\d)\/(\d{4})$/.exec(raw)
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1])
    const month = Number(ddmmyyyy[2])
    const year = Number(ddmmyyyy[3])

    if (month < 1 || month > 12) return null
    if (day < 1 || day > 31) return null

    const utcMillis = Date.UTC(year, month - 1, day)
    const date = new Date(utcMillis)
    if (Number.isNaN(date.getTime())) return null

    // Validate that Date didn't roll over (e.g. 31/02/2025).
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null
    }

    // Return as YYYY-MM-DD to keep date-only semantics.
    return `${year.toString().padStart(4, '0')}-${month
      .toString()
      .padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  const ms = Date.parse(raw)
  if (Number.isNaN(ms)) return null
  return new Date(ms).toISOString()
}

function buildObjectPath(albumSlug: string, originalName: string) {
  // Force all objects to live under the `albums/` prefix within the bucket.
  // Also sanitize the slug so a caller can't inject extra path segments.
  const safeSlug = albumSlug
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.+/g, '')
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()

  const safeName = originalName.replace(/[^a-zA-Z0-9._-]+/g, '_')
  const ext = safeName.includes('.') ? safeName.split('.').pop() : undefined
  const base = crypto.randomUUID()
  const filename = ext ? `${base}.${ext}` : base
  return `albums/${safeSlug}/${filename}`
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
  const altRaw = form.get('alt')
  const alt = altRaw == null ? null : String(altRaw).trim() || null
  const captionRaw = form.get('caption')
  const caption = captionRaw == null ? null : String(captionRaw).trim() || null
  const urlParams = new URL(req.url).searchParams
  const locationRaw = form.get('location') ?? urlParams.get('location')
  const location = locationRaw == null ? null : String(locationRaw).trim() || null
  const takenAtRaw = form.get('taken_at') ?? urlParams.get('taken_at')
  const takenAt = normalizeTakenAt(takenAtRaw)
  const file = form.get('file')

  if (!albumSlug) return json(req, 400, { error: 'album_slug is required' })
  if (!(file instanceof File)) return json(req, 400, { error: 'file is required' })

  // If the user provided taken_at but it's invalid, fail early (before uploading).
  if (takenAtRaw != null && String(takenAtRaw).trim() !== '' && takenAt == null) {
    return json(req, 400, {
      error:
        'Invalid taken_at. Use DD/MM/YYYY, YYYY-MM-DD or ISO 8601 (e.g. 2024-06-12T15:30:00Z).',
    })
  }

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

  // Insert photo row with smart fallback: if optional columns don't exist yet,
  // retry dropping ONLY the missing column(s) so we don't accidentally lose `location`.
  const baseRow: Record<string, unknown> = {
    album_slug: albumSlug,
    alt,
    caption,
    image_path: path,
  }

  const row: Record<string, unknown> = { ...baseRow }
  if (location != null) row.location = location
  if (takenAt != null) row.taken_at = takenAt

  let finalInserted: { id: string; image_path: string; location?: string | null; taken_at?: string | null } | null = null
  let finalInsertError: unknown = null

  for (let attemptIndex = 0; attemptIndex < 3; attemptIndex++) {
    const attempt = await supabaseAdmin
      .from('photos')
      .insert(row)
      .select('id, image_path, location, taken_at')
      .single()

    if (!attempt.error) {
      finalInserted = attempt.data
      finalInsertError = null
      break
    }

    finalInsertError = attempt.error

    let removedAny = false
    if ('location' in row && isMissingColumnError(finalInsertError, 'location')) {
      delete row.location
      removedAny = true
    }
    if ('taken_at' in row && isMissingColumnError(finalInsertError, 'taken_at')) {
      delete row.taken_at
      removedAny = true
    }

    if (!removedAny) break
  }

  if (finalInsertError || !finalInserted) {
    try {
      await supabaseAdmin.storage.from(bucket).remove([path])
    } catch {
      // ignore cleanup failures
    }

    const code = typeof finalInsertError === 'object' && finalInsertError && 'code' in finalInsertError
      ? String((finalInsertError as { code: unknown }).code)
      : ''

    if (code === '23503') {
      return json(req, 400, {
        error: `album_slug does not exist: ${albumSlug}`,
      })
    }

    const message =
      typeof finalInsertError === 'object' && finalInsertError && 'message' in finalInsertError
        ? String((finalInsertError as { message: unknown }).message)
        : 'Failed to insert photo'
    return json(req, 500, { error: message })
  }

  const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)

  return json(req, 200, {
    ok: true,
    photo: {
      id: finalInserted.id,
      image_path: finalInserted.image_path,
      location: 'location' in finalInserted ? (finalInserted.location ?? null) : null,
      taken_at: 'taken_at' in finalInserted ? (finalInserted.taken_at ?? null) : null,
      public_url: publicData.publicUrl,
    },
  })
})
