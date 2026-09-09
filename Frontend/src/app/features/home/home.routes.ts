import { Routes } from '@angular/router';

import { HomeHighlightsRepository } from './data/home-highlights.repository';
import { HttpHomeHighlightsRepository } from './data/home-highlights.repository.http';

/**
 * Routes du domaine « Accueil ».
 *
 * Cette feature ne correspond à aucun microservice, contrairement aux autres
 * (CONVENTIONS.md §1). L'exception est assumée : l'accueil est un écran
 * d'**agrégation**, dont le rôle est d'orienter vers les autres domaines. Le
 * loger dans `mechanics` ou `requests` reviendrait à donner à un domaine métier
 * la charge de présenter les autres.
 *
 * La règle de dépendance reste intacte : cette feature n'importe aucune autre
 * feature. Elle atteint les autres écrans par leur URL, jamais par un import,
 * et son dépôt fait lui-même les appels HTTP dont elle a besoin.
 */
export const homeRoutes: Routes = [
  {
    path: '',
    providers: [
      { provide: HomeHighlightsRepository, useClass: HttpHomeHighlightsRepository },
    ],
    loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
    title: 'Accueil — AutoPro',
  },
];
