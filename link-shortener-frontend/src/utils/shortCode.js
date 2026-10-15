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

export function buildShortUrl(link) {
  return `clk.me/${getLinkCode(link)}`
}
