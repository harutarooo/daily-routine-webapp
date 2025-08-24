import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GitHub Pages で /<repo>/ 配下に配置されることを想定し base を設定
const repoName = 'daily-routine-webapp'
export default defineConfig({
  base: `/${repoName}/`,
  plugins: [react()],
})
