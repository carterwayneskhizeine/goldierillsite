import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // 允许所有主机名访问
    allowedHosts: true,
    
    host: '0.0.0.0', // 监听所有本地 IP
    port: 5933,      // 端口号
    watch: {
      usePolling: true
    }
  }
})
