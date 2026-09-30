import { loadLines, purgeExpired, syncLines, persistLines } from './notes.js'

const editor = document.getElementById('editor')

// ─── Load & restore ───────────────────────────────────────────────────────────

function getStoredLines() {
  return purgeExpired(loadLines())
}

function restoreEditor() {
  const lines = getStoredLines()
  editor.value = lines.map(l => l.text).join('\n')
}

// ─── Persist on change ────────────────────────────────────────────────────────

let stored = getStoredLines()

function onInput() {
  const textLines = editor.value.split('\n')
  stored = syncLines(textLines, stored)
  persistLines(stored)
}

editor.addEventListener('input', onInput)

// ─── Purge expired lines periodically ────────────────────────────────────────

function purgeAndUpdate() {
  const before = stored.map(l => l.text).join('\n')
  stored = purgeExpired(stored)
  persistLines(stored)

  const after = stored.map(l => l.text).join('\n')
  if (after !== before) {
    // Save and restore cursor as best we can
    const sel = editor.selectionStart
    editor.value = after
    editor.selectionStart = editor.selectionEnd = Math.min(sel, after.length)
  }
}

setInterval(purgeAndUpdate, 10_000) // check every 10 seconds

// ─── Init ─────────────────────────────────────────────────────────────────────

restoreEditor()
stored = getStoredLines()
editor.focus()
