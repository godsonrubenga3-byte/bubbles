import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bubblestz.app',
  appName: 'bubbletz',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
