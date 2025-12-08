import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.meetmefit.sportbuddy',
  appName: 'MeetMeFit',
  webDir: 'www'
  // server.url is not set, so the app will use bundled assets
  // To enable live reload during development, uncomment and set your local IP:
  // server: {
  //   url: 'http://YOUR_LOCAL_IP:4200',
  //   cleartext: true
  // }
};

export default config;
