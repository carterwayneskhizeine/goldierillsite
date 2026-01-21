import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: [
      'goldierill.com',
      '.goldierill.com' // 允许所有子域名
    ]
  }
})
