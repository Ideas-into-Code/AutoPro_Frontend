import { Routes } from '@angular/router';

import { BrowserPositionProvider, PositionProvider } from '@core';
import { RequestRepository } from './data/request.repository';
import { MockRequestRepository } from './data/request.repository.mock';

/**
 * Routes du domaine « Demandes ».
 * Demandes d'intervention : envoi, acceptation, refus.
 *
 * Structure de ce dossier (CONVENTIONS.md §1) :
 *   data/        dépôts d'accès au microservice « requests »
 *   models/      types propres au domaine
 *   components/  composants réutilisés dans cette feature uniquement
 *   pages/       composants routés, déclarés ci-dessous
 *
 * La consultation et l'annulation d'une demande restent à écrire.
 */
export const requestsRoutes: Routes = [
  {
    path: '',

    /**
     * POINT DE BASCULE DU DOMAINE « DEMANDES ».
     *
     * Le jour où le microservice répond, cette ligne devient :
     *
     *   { provide: RequestRepository, useClass: HttpRequestRepository }
     *
     * `HttpRequestRepository` est déjà écrit, envoi des photos en
     * `multipart/form-data` compris. Le formulaire ne change pas d'une ligne.
     *
     * `PositionProvider` est fourni ici plutôt que globalement : seul ce
     * domaine s'en sert pour l'instant. Quand la carte interactive (#7)
     * arrivera, il remontera dans `provideCore()` — les deux features en
     * auront besoin, et une feature n'importe jamais une autre feature.
     */
    providers: [
      { provide: RequestRepository, useClass: MockRequestRepository },
      { provide: PositionProvider, useClass: BrowserPositionProvider },
    ],

    children: [
      {
        path: 'signaler',
        loadComponent: () =>
          import('./pages/report-problem/report-problem').then((m) => m.ReportProblemPage),
        title: 'Signaler un problème — AutoPro',
      },
      {
        path: '',
        redirectTo: 'signaler',
        pathMatch: 'full',
      },
    ],
  },
];
