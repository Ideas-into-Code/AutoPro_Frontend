import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

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
    provideCore(),
    // Tant que le backend n'est pas en ligne, les dépôts servent des données
    // fabriquées. Le jour où il l'est, cette ligne devient
    // `provideHttpRepositories()` et rien d'autre ne bouge.
    // Voir core/data/repositories.providers.ts.
    provideMockRepositories(),
  ],
};
