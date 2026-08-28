import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode
} from '@angular/core';

import { provideRouter } from '@angular/router';

import {
  provideHttpClient,
  withInterceptors,
  HttpInterceptorFn
} from '@angular/common/http';

import { provideTransloco } from '@jsverse/transloco';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-loader';


const languageInterceptor: HttpInterceptorFn = (req, next) => {

  const language = localStorage.getItem('language') || 'az';

  return next(
    req.clone({
      setHeaders: {
        'Accept-Language': language
      }
    })
  );
};


export const appConfig: ApplicationConfig = {
  providers: [

    provideZoneChangeDetection({
      eventCoalescing: true
    }),

    provideRouter(routes),

    provideHttpClient(
      withInterceptors([
        languageInterceptor
      ])
    ),

    provideTransloco({
      config: {
        availableLangs: ['az', 'en'],
        defaultLang: 'az',
        reRenderOnLangChange: true,
        prodMode: !isDevMode()
      },

      loader: TranslocoHttpLoader
    })

  ]
};