import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import AOS from 'aos';

// Initialize AOS
AOS.init({
  duration: 800,
  easing: 'ease-in-out',
  once: true,
  offset: 100
});

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
