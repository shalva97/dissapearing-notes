const STORAGE_KEY = 'disappearing-notes-lines'
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * A line entry: { text: string, createdAt: number }
 * Empty lines ("") are stored so cursor position is preserved,
 * but they are never given a new timestamp — they inherit the
 * timestamp of the nearest non-empty line above, or Date.now().
 */

/** @returns {Array<{text: string, createdAt: number}>} */
export function loadLines() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveLines(lines) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
}

/**
 * Remove lines whose createdAt is older than TTL.
 * Empty lines adjacent to expired content are also dropped.
 */
export function purgeExpired(lines) {
  const now = Date.now()
  return lines.filter(l => now - l.createdAt < TTL_MS)
}

/**
 * Reconcile stored lines with the current textarea content.
 * - New lines (not in stored) get createdAt = now
 * - Existing lines keep their original createdAt
 * Matching is done positionally: line index → stored entry.
 */
export function syncLines(textareaLines, stored) {
  const now = Date.now()
  return textareaLines.map((text, i) => ({
    text,
    createdAt: stored[i]?.createdAt ?? now,
  }))
}

export function persistLines(lines) {
  saveLines(lines)
}

export function msUntilExpiry(line) {
  return line.createdAt + TTL_MS - Date.now()
}
