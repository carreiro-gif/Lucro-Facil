
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Define a base como relativa ('./') para que os assets (js/css) 
  // sejam carregados corretamente independente do repositório/subpasta no GitHub Pages.
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
