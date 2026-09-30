import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  // Use the repo-name base only for production builds (GitHub Pages).
  // Locally (dev + preview) the app is served from root.
  base: command === 'build' ? '/dissapearing-notes/' : '/',
}))
