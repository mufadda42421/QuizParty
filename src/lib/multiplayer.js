// Shared multiplayer helpers.
// Peer ids for hosts are derived from a short human-friendly room code.

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no easily confused chars
export const ROOM_CODE_LENGTH = 5
export const HOST_PEER_PREFIX = 'qp1-' // namespace so other PeerJS apps never clash

export function generateRoomCode() {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)]
  }
  return code
}

export function hostPeerId(code) {
  return HOST_PEER_PREFIX + code.trim().toUpperCase()
}

export function sanitizeName(name) {
  const cleaned = String(name ?? '')
    .replace(/[<>&"'`]/g, '')
    .trim()
    .slice(0, 24)
  return cleaned || 'Player'
}

// Speed-based scoring: a correct answer is worth 500 base + up to 500 more
// depending on how quickly it was given.
export function scoreFor(elapsedMs, timeLimitMs) {
  const remaining = Math.max(0, 1 - elapsedMs / timeLimitMs)
  return Math.round(500 + 500 * remaining)
}
