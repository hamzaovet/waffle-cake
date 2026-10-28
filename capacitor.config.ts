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
    backgroundColor: '#F8F4EC',
  },
};

export default config;
