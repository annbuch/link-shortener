// Генерация короткого кода (аналог short_code на бэкенде).
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateShortCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

export function buildShortUrl(link) {
  const code = link.alias && link.alias.trim() ? link.alias.trim() : link.shortCode
  return `clk.me/${code}`
}
