import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { environment } from '../environments/environment';
import { DEFAULT_API_CONFIG } from './core/config/api.config';
import { provideCore } from './core/core.providers';
import { provideMockRepositories } from './core/data/repositories.providers';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Lie les paramètres de route aux `input()` des composants : évite
      // d'injecter ActivatedRoute juste pour lire un identifiant.
      withComponentInputBinding(),
      // Restaure la position de défilement lors d'un retour arrière.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideClientHydration(),
    // `gateway` vient de l'environnement : `/api` en dev (proxy), URL absolue
    // du backend Render en prod.
    provideCore({ ...DEFAULT_API_CONFIG, gateway: environment.apiBaseUrl }),
    // `ServiceCategoryRepository` n'a pas encore d'endpoint backend (taxonomie
    // fixe) : seul dépôt encore simulé. Tous les autres sont HTTP.
    provideMockRepositories(),
  ],
};
