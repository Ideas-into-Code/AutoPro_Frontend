import { Routes } from '@angular/router';

import { roleGuard } from '@core/guards/auth.guard';

import {
  MechanicAvailabilityRepository,
  MechanicDashboardRepository,
  RequestDecisionRepository,
} from './data/mechanic-dashboard.repository';
import {
  HttpMechanicAvailabilityRepository,
  HttpMechanicDashboardRepository,
  HttpRequestDecisionRepository,
} from './data/mechanic-dashboard.repository.http';
import {
  HttpMechanicRequestRepository,
  MechanicRequestRepository,
} from './data/mechanic-request.repository';

/**
 * Routes de l'espace mécanicien.
 *
 * Cette feature ne correspond à aucun microservice, comme `home` : c'est un
 * écran d'agrégation qui réunit gains, disponibilité et demandes. L'exception
 * est la même, et la règle de dépendance reste intacte — aucune autre feature
 * n'est importée.
 */
export const mechanicDashboardRoutes: Routes = [
  {
    path: '',

    // Espace réservé aux mécaniciens authentifiés.
    canMatch: [roleGuard('mecanicien')],

    /**
     * Dépôts de l'espace mécanicien, tous branchés sur le backend :
     * gains (`/api/mechanic/earnings/{id}`), disponibilité
     * (`/api/mechanics/me/availability`), demande entrante et décision
     * (`/api/service-requests`).
     */
    providers: [
      { provide: MechanicDashboardRepository, useClass: HttpMechanicDashboardRepository },
      { provide: MechanicAvailabilityRepository, useClass: HttpMechanicAvailabilityRepository },
      { provide: RequestDecisionRepository, useClass: HttpRequestDecisionRepository },
      { provide: MechanicRequestRepository, useClass: HttpMechanicRequestRepository },
    ],

    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/mechanic-dashboard/mechanic-dashboard').then(
            (m) => m.MechanicDashboardPage,
          ),
        title: 'Tableau de bord mécanicien — AutoPro',
      },

      {
        path: 'carte',
        loadComponent: () =>
          import('./pages/mechanic-map/mechanic-map').then((m) => m.MechanicMapPage),
        title: 'Carte — AutoPro',
      },
      {
        path: 'demandes',
        loadComponent: () =>
          import('./pages/mechanic-requests/mechanic-requests').then((m) => m.MechanicRequestsPage),
        title: 'Demandes reçues — AutoPro',
      },
      {
        path: 'demandes/:id',
        loadComponent: () =>
          import('./pages/mechanic-request-detail/mechanic-request-detail').then(
            (m) => m.MechanicRequestDetailPage,
          ),
        title: 'Suivi de l\'intervention — AutoPro',
      },
    ],
  },
];
