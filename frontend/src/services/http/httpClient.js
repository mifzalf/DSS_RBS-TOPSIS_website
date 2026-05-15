import { emitUnauthorized } from './sessionEvents'
import { authStorage } from './storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const error = new Error(payload?.message || 'Request failed')
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

async function request(path, options = {}) {
  const token = authStorage.getToken()
  const headers = new Headers(options.headers || {})
  const isFormData = options.body instanceof FormData
  const isRaw = options.raw === true

  if (options.body !== undefined && !isFormData && !isRaw && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let body
  if (options.body === undefined || options.body === null) {
    body = undefined
  } else if (isFormData || isRaw) {
    body = options.body
  } else {
    body = JSON.stringify(options.body)
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      body,
    })

    if (options.responseType === 'blob') {
      if (!response.ok) {
        const text = await response.text()
        const error = new Error(text || 'Request failed')
        error.status = response.status
        throw error
      }
      return {
        blob: await response.blob(),
        filename: parseContentDisposition(response.headers.get('content-disposition')),
      }
    }

    return await parseResponse(response)
  } catch (error) {
    if (error.status === 401) {
      authStorage.clearSession()
      emitUnauthorized()
    }

    throw error
  }
}

function parseContentDisposition(headerValue) {
  if (!headerValue) return null
  const match = /filename="?([^";]+)"?/i.exec(headerValue)
  return match ? match[1] : null
}

export const httpClient = {
  get: (path, options) => request(path, { method: 'GET', ...(options || {}) }),
  post: (path, body, options) => request(path, { method: 'POST', body, ...(options || {}) }),
  patch: (path, body, options) => request(path, { method: 'PATCH', body, ...(options || {}) }),
  delete: (path, options) => request(path, { method: 'DELETE', ...(options || {}) }),
  download: (path, options) => request(path, { method: 'GET', responseType: 'blob', ...(options || {}) }),
  upload: (path, formData, options) => request(path, { method: 'POST', body: formData, ...(options || {}) }),
}
