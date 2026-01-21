import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: [
      'goldierill.com',
      '.goldierill.com' // 允许所有子域名
    ],
    watch: {
      usePolling: true // 使用轮询模式以支持 Windows Docker 热重载
    }
  }
})
