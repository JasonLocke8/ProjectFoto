import type { Album } from './albums'
import { albums, getAlbumBySlug } from './albums'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

type DbAlbum = {
  slug: string
  title: string
  subtitle: string | null
  cover_path: string | null
}

type DbPhoto = {
  id: string
  album_slug: string
  alt: string
  caption: string | null
  image_path: string
  taken_at?: string | null
  location?: string | null
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

function getBucket() {
  return (import.meta.env.VITE_SUPABASE_BUCKET as string | undefined) ?? 'photos'
}

function publicUrlForPath(path: string) {
  if (!supabase) return path
  const { data } = supabase.storage.from(getBucket()).getPublicUrl(path)
  return data.publicUrl
}

export async function listAlbums(): Promise<Album[]> {
  if (!isSupabaseConfigured || !supabase) return albums

  const { data: dbAlbums, error } = await supabase
    .from('albums')
    .select('slug,title,subtitle,cover_path')
    .order('title', { ascending: true })

  if (error || !dbAlbums) return albums

  const mapped: Album[] = dbAlbums.map((a: DbAlbum) => ({
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle ?? undefined,
    coverSrc: a.cover_path ? publicUrlForPath(a.cover_path) : '',
    photos: [],
  }))

  return mapped
}

export async function getAlbum(slug: string): Promise<Album | undefined> {
  if (!isSupabaseConfigured || !supabase) return getAlbumBySlug(slug)

  const { data: rowsWithExtras, error: withExtrasError } = await supabase
    .from('photos')
    .select('id,album_slug,alt,caption,image_path,taken_at,location')
    .eq('album_slug', slug)
    .order('id', { ascending: true })

  let rows: DbPhoto[] | null = rowsWithExtras as DbPhoto[] | null

  if (withExtrasError) {
    if (
      isMissingColumnError(withExtrasError, 'taken_at') ||
      isMissingColumnError(withExtrasError, 'location')
    ) {
      const { data: legacyRows, error: legacyError } = await supabase
        .from('photos')
        .select('id,album_slug,alt,caption,image_path')
        .eq('album_slug', slug)
        .order('id', { ascending: true })

      if (legacyError) return getAlbumBySlug(slug)
      rows = legacyRows as DbPhoto[] | null
    } else {
      return getAlbumBySlug(slug)
    }
  }

  const { data: albumRow } = await supabase
    .from('albums')
    .select('slug,title,subtitle,cover_path')
    .eq('slug', slug)
    .maybeSingle()

  if (!albumRow) return undefined

  const photos = (rows ?? []).map((p: DbPhoto) => ({
    id: p.id,
    src: publicUrlForPath(p.image_path),
    alt: p.alt,
    caption: p.caption ?? undefined,
    takenAt: p.taken_at ?? undefined,
    location: p.location ?? undefined,
  }))

  return {
    slug: albumRow.slug,
    title: albumRow.title,
    subtitle: albumRow.subtitle ?? undefined,
    coverSrc: albumRow.cover_path ? publicUrlForPath(albumRow.cover_path) : '',
    photos,
  }
}
