const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001'

let _token: string | null = null
export const setToken = (t: string) => { _token = t }
export const getToken = () => _token

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  const json = await res.json() as { ok: boolean; data?: T; error?: string }
  if (!json.ok) throw new Error(json.error ?? 'API error')
  return json.data as T
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {}
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const res = await fetch(`${BASE}/api${path}`, { method: 'POST', headers, body: formData })
  const json = await res.json() as { ok: boolean; data?: T; error?: string }
  if (!json.ok) throw new Error(json.error ?? 'Upload error')
  return json.data as T
}

export const api = {
  get:    <T>(path: string)                 => request<T>('GET', path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch:  <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  upload: <T>(path: string, form: FormData) => upload<T>(path, form),
}
