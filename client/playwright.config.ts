import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://localhost:5174', headless: true },
  webServer: {
    command: 'npm run dev -- --host localhost --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: 'https://stylefit-test.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-public-key',
      VITE_API_BASE_URL: 'http://localhost:8999',
    },
  },
})
