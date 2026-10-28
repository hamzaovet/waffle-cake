import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wafflecake.desserts',
  appName: 'Waffle & Cake',
  webDir: 'public',
  server: {
    url: 'https://waffle-cake.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0d0805',
  },
};

export default config;
