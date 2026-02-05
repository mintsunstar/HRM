import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { copyFileSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  base: '/HRM/',
  plugins: [
    react(),
    {
      name: 'copy-404',
      closeBundle() {
        // 빌드 완료 후 404.html 생성 (GitHub Pages SPA 라우팅 지원)
        try {
          copyFileSync(
            path.resolve(__dirname, 'dist/index.html'),
            path.resolve(__dirname, 'dist/404.html')
          )
        } catch (err) {
          console.warn('Failed to copy 404.html:', err)
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
