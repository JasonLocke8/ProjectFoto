const DEFAULT_ALLOW_HEADERS = [
  'authorization',
  'x-client-info',
  'apikey',
  'content-type',
  'x-admin-secret',
]

export function corsHeadersForRequest(req: Request) {
  const origin = req.headers.get('origin') ?? '*'

  return {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': DEFAULT_ALLOW_HEADERS.join(', '),
    'vary': 'Origin',
  }
}
