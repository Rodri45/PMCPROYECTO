import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tuempresa.pmc',
  appName: 'PMC CRM',
  webDir: 'build',
  server: { androidScheme: 'https' } // seguro en Android
};

export default config;
