import { Routes } from '@angular/router';

import { BrowserPositionProvider, PositionProvider } from '@core';
import { authGuard } from '@core/guards/auth.guard';
import { RequestRepository } from './data/request.repository';
import { HttpRequestRepository } from './data/request.repository.http';

/**
 * Routes du domaine « Demandes » : envoi, liste, suivi, annulation.
 *
 * Les demandes appartiennent à l'utilisateur connecté — d'où `authGuard` sur
 * tout le domaine. Le dépôt s'adresse au vrai backend (`/api/service-requests`).
 */
export const requestsRoutes: Routes = [
  {
    path: '',
    canMatch: [authGuard],

    providers: [
      { provide: RequestRepository, useClass: HttpRequestRepository },
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
        loadComponent: () => import('./pages/my-requests/my-requests').then((m) => m.MyRequestsPage),
        title: 'Mes demandes — AutoPro',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/request-detail/request-detail').then((m) => m.RequestDetailPage),
        title: 'Suivi de la demande — AutoPro',
      },
    ],
  },
];
