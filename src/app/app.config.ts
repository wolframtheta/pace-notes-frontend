import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { barrufaAuraPreset } from './theme/barrufa-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: barrufaAuraPreset,
        options: {
          darkModeSelector: false
        }
      }
    }),
    MessageService,
    ConfirmationService
  ]
};
