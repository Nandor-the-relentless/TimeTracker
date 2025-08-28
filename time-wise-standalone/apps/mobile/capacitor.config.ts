import { CapacitorConfig } from '@capacitor/cli'
const isDev = process.env.NODE_ENV !== 'production'
const config: CapacitorConfig = {
  appId: 'com.timewise.app',
  appName: 'TimeWise',
  webDir: '../web/dist',
  server: isDev ? { url: 'http://127.0.0.1:5173', cleartext: true }
                : { url: process.env.APP_PUBLIC_URL, cleartext: false }
}
export default config
