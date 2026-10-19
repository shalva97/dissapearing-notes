import { loadLines, purgeExpired, syncLines, persistLines } from './notes.js'

const STORAGE_KEY = 'disappearing-notes-lines'
const CURSOR_KEY = 'disappearing-notes-cursor'
const editor = document.getElementById('editor')

// ─── Load & restore ───────────────────────────────────────────────────────────

function getStoredLines() {
  return purgeExpired(loadLines())
}

// Update the editor textarea from an array of line objects, preserving cursor.
function applyLines(lines, cursorOverride = null) {
  const text = lines.map(l => l.text).join('\n')
  const sel = cursorOverride ?? editor.selectionStart
  if (editor.value !== text) {
    editor.value = text
  }
  const clamped = Math.min(sel, text.length)
  editor.selectionStart = editor.selectionEnd = clamped
}

// Broadcast this tab's cursor position so other tabs can mirror it.
function broadcastCursor() {
  localStorage.setItem(CURSOR_KEY, String(editor.selectionStart))
}

// ─── Persist on change ────────────────────────────────────────────────────────

let stored = getStoredLines()

function onInput() {
  const textLines = editor.value.split('\n')
  // Always reconcile against the latest stored state so we preserve createdAt
  // timestamps correctly even if another tab wrote to localStorage recently.
  stored = syncLines(textLines, stored)
  persistLines(stored)
  broadcastCursor()
}

editor.addEventListener('input', onInput)
editor.addEventListener('keyup', broadcastCursor)
editor.addEventListener('pointerup', broadcastCursor)
editor.addEventListener('selectionchange', broadcastCursor)

// ─── Cross-tab sync ───────────────────────────────────────────────────────────

// The `storage` event fires in every tab *except* the one that wrote the data.
// When another tab updates the notes, pull in its version and refresh the UI.
// We do NOT apply the foreign update if this tab currently has focus and the
// user is actively typing — their pending keystrokes take priority and the next
// `onInput` will merge correctly.
window.addEventListener('storage', (e) => {
  if (e.key === CURSOR_KEY) {
    // Mirror the writing tab's cursor only when this tab is idle (not focused).
    if (!document.hasFocus()) {
      const pos = parseInt(e.newValue ?? '0', 10)
      if (!Number.isNaN(pos)) {
        editor.selectionStart = editor.selectionEnd = Math.min(pos, editor.value.length)
      }
    }
    return
  }

  if (e.key !== STORAGE_KEY) return

  const incoming = purgeExpired(JSON.parse(e.newValue ?? '[]'))

  // If this tab is focused and has a pending selection the user may be mid-edit.
  // Refresh stored timestamps from the incoming data so the next onInput uses
  // up-to-date createdAt values, but only repaint the textarea when this tab
  // is not the active one to avoid clobbering an in-progress edit.
  if (document.hasFocus()) {
    // Merge: keep textarea text as-is but adopt timestamps from incoming where
    // text matches, so our next persistLines won't overwrite newer createdAt.
    const textLines = editor.value.split('\n')
    stored = syncLines(textLines, incoming)
  } else {
    // Read the writing tab's last known cursor position alongside the new text.
    const remoteCursor = parseInt(localStorage.getItem(CURSOR_KEY) ?? '0', 10)
    stored = incoming
    applyLines(stored, Number.isNaN(remoteCursor) ? null : remoteCursor)
  }
})

// ─── Purge expired lines periodically ────────────────────────────────────────

function purgeAndUpdate() {
  stored = purgeExpired(stored)
  persistLines(stored)
  applyLines(stored)
}

setInterval(purgeAndUpdate, 10_000) // check every 10 seconds

// ─── Init ─────────────────────────────────────────────────────────────────────

applyLines(getStoredLines())
stored = getStoredLines()
editor.focus()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(
    import.meta.env.BASE_URL + 'sw.js'
  )
}
