import { Routes } from '@angular/router';

import { BrowserPositionProvider, PositionProvider } from '@core';

/**
 * Routes du domaine « Géolocalisation ».
 * Carte interactive Leaflet et suivi des mécaniciens.
 */
export const geolocationRoutes: Routes = [
  {
    path: '',
    providers: [{ provide: PositionProvider, useClass: BrowserPositionProvider }],
    loadComponent: () =>
      import('./pages/interactive-map-page/interactive-map-page').then((m) => m.InteractiveMapPage),
  },
];
