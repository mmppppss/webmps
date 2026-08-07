import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'

const siteConfig = JSON.parse(fs.readFileSync('./src/config.json', 'utf8'))

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...siteConfig }
  
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SITE_NAME': JSON.stringify(siteConfig.siteName),
      'import.meta.env.VITE_SITE_TITLE': JSON.stringify(siteConfig.siteTitle),
      'import.meta.env.VITE_SITE_URL': JSON.stringify(siteConfig.siteUrl),
      'import.meta.env.VITE_SITE_TWITTER': JSON.stringify(siteConfig.siteTwitter),
      'import.meta.env.VITE_SITE_KEYWORDS': JSON.stringify(siteConfig.siteKeywords),
    }
  }
})
