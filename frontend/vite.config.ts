import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { ServerResponse } from 'node:http'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        configure(proxy) {
          proxy.prependListener('error', (_error, _request, response) => {
            if (response instanceof ServerResponse && !response.headersSent) {
              response.writeHead(502, { 'Content-Type': 'application/json' })
              response.end(JSON.stringify({ error: 'Go-сервис недоступен' }))
            }
          })
        },
      },
      '/s3': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/s3/, ''),
      },
    },
  },
})
