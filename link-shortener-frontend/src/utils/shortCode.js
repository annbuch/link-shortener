const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateShortCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

export function getLinkCode(link) {
  return link.alias && link.alias.trim() ? link.alias.trim() : link.shortCode
}

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3000').replace(/\/+$/, '')

export function buildShortUrl(link) {
  return `${API_BASE.replace(/^https?:\/\//, '')}/${getLinkCode(link)}`
}

export function buildShortUrlAbsolute(link) {
  return `${API_BASE}/${getLinkCode(link)}`
}
