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
        // 404.html은 index.html과 동일해야 React Router가 라우팅을 처리할 수 있음
        try {
          const distIndexPath = path.resolve(__dirname, 'dist/index.html')
          const dist404Path = path.resolve(__dirname, 'dist/404.html')
          
          // index.html을 404.html로 복사 (GitHub Pages가 404 오류 시 이 파일을 사용)
          copyFileSync(distIndexPath, dist404Path)
          console.log('✓ 404.html created for GitHub Pages SPA routing')
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
